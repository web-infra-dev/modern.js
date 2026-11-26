import { execFile } from 'node:child_process';
import { realpathSync, statSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { resolve } from 'node:path';
import { parseArgs, promisify } from 'node:util';
import {
  generatedDirectory,
  readWorkspace,
} from './check-dependencies/workspace.mjs';

const exec = promisify(execFile);
const usage =
  'Usage: pnpm check-package-exports [--filter <package>] [package ...]';

// JS defaults are not necessarily Node APIs (some start a CLI or need a DOM).
// Only probe explicit Node import/require contracts and prebundled CJS fallbacks.
function nativeMode(conditions, target) {
  if (target.startsWith('./dist/esm/')) return;
  if (
    conditions.some(
      key => !['node', 'import', 'require', 'default'].includes(key),
    )
  )
    return;
  if (conditions.includes('import')) return 'esm';
  if (conditions.includes('require')) return 'cjs';
  if (conditions.includes('default') && target.startsWith('./dist/compiled/'))
    return 'cjs';
}

function inspectPackage({ directory, manifest }, errors) {
  const entries = { esm: new Map(), cjs: new Map() };
  function visit(subpath, value, conditions) {
    if (typeof value === 'string') {
      const mode = nativeMode(conditions, value);
      let target = resolve(directory, value);
      try {
        if (!statSync(target).isFile()) throw new Error('not a file');
        if (mode) target = realpathSync(target);
      } catch (error) {
        errors.push(
          `${manifest.name} ${subpath} [${mode ?? (conditions.join('.') || 'file')}] ${value}: ${error.message}`,
        );
      }
      const spec = manifest.name + subpath.slice(1);
      if (mode && !entries[mode].has(spec)) entries[mode].set(spec, target);
    } else if (Array.isArray(value)) {
      for (const branch of value) visit(subpath, branch, conditions);
    } else if (value) {
      for (const [condition, branch] of Object.entries(value)) {
        visit(subpath, branch, [...conditions, condition]);
      }
    }
  }

  const exports = manifest.exports;
  if (Object.keys(exports).some(key => key.startsWith('.'))) {
    for (const [subpath, value] of Object.entries(exports))
      visit(subpath, value, []);
  } else {
    visit('.', exports, []);
  }
  if (manifest.main) visit('.', manifest.main, ['main']);
  return Object.entries(entries)
    .filter(([, specs]) => specs.size)
    .map(([mode, specs]) => ({ directory, mode, specs: [...specs] }));
}

const completion = '::exports-loaded::';
async function load({ directory, mode }, specs) {
  const esm = mode === 'esm';
  const source = `
    ${esm ? "import { fileURLToPath } from 'node:url';" : ''}
    for (const [spec, expected] of JSON.parse(process.argv[1])) {
      const actual = ${esm ? 'fileURLToPath(import.meta.resolve(spec))' : 'require.resolve(spec)'};
      if (actual !== expected) throw new Error(spec + ': expected ' + expected + ', but Node resolved ' + actual);
      ${esm ? 'await import(spec)' : 'require(spec)'};
    }
    console.log('${completion}');`;
  const { stdout } = await exec(
    process.execPath,
    [
      `--input-type=${esm ? 'module' : 'commonjs'}`,
      '-e',
      source,
      '--',
      JSON.stringify(specs),
    ],
    {
      cwd: directory,
      // Probe stock Node conditions, not the caller's custom loaders or --conditions.
      env: { ...process.env, NODE_OPTIONS: '' },
      timeout: 30_000,
      killSignal: 'SIGKILL',
    },
  );
  if (!stdout.split('\n').includes(completion))
    throw new Error('Node exited before loading all exports');
}

function diagnostic(mode, specs, error) {
  const cause = error.killed
    ? 'Node timed out after 30s'
    : error.stderr?.trim() || error.message;
  return `${specs.map(([name]) => name).join(', ')} [${mode}]: ${cause}`;
}

async function checkBatch(job) {
  try {
    await load(job, job.specs);
    return [];
  } catch (batchError) {
    if (job.specs.length === 1)
      return [diagnostic(job.mode, job.specs, batchError)];
    const errors = [];
    for (const spec of job.specs) {
      try {
        await load(job, [spec]);
      } catch (error) {
        errors.push(diagnostic(job.mode, [spec], error));
      }
    }
    // Don't hide a failure that only reproduces when entries are loaded together.
    return errors.length
      ? errors
      : [diagnostic(job.mode, job.specs, batchError)];
  }
}

async function main() {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      filter: { type: 'string', multiple: true },
      help: { type: 'boolean' },
    },
  });
  if (values.help) return console.log(usage);
  const names = new Set([...positionals, ...(values.filter ?? [])]);
  const packages = (
    await readWorkspace(resolve(import.meta.dirname, '..'))
  ).filter(
    ({ path, manifest }) =>
      path.startsWith('packages/') &&
      !generatedDirectory.test(path) &&
      !manifest.private &&
      manifest.exports &&
      (!names.size || names.has(manifest.name)),
  );
  for (const name of names) {
    if (!packages.some(({ manifest }) => manifest.name === name))
      throw new Error(`No publishable package with exports named ${name}`);
  }
  if (!packages.length)
    throw new Error('No publishable packages with exports found');

  const errors = [];
  const jobs = packages.flatMap(pkg => inspectPackage(pkg, errors));
  const queue = jobs.values();
  await Promise.all(
    Array.from(
      { length: Math.min(jobs.length, availableParallelism(), 8) },
      async () => {
        for (const job of queue) errors.push(...(await checkBatch(job)));
      },
    ),
  );
  for (const error of errors) console.error(error);
  const count = mode =>
    jobs
      .filter(job => job.mode === mode)
      .reduce((sum, job) => sum + job.specs.length, 0);
  console.log(
    `Checked ${packages.length} package${packages.length === 1 ? '' : 's'} (${count('esm')} ESM, ${count('cjs')} CJS exports).`,
  );
  if (errors.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
