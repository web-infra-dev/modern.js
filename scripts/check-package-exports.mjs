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

function nodeEntry(value, condition, explicit = false) {
  if (value == null) return value;
  if (typeof value === 'string') {
    // Other JS defaults can start a CLI or require a DOM.
    const load =
      !value.startsWith('./dist/esm/') &&
      (explicit ||
        value.endsWith('.cjs') ||
        value.startsWith('./dist/cjs/') ||
        value.startsWith('./dist/compiled/'));
    return { target: value, check: load ? 'load' : 'file' };
  }
  if (Array.isArray(value)) {
    for (const branch of value) {
      const entry = nodeEntry(branch, condition, explicit);
      if (entry != null) return entry;
    }
    return;
  }
  // Prefer the declared mode over its fallback. The child checks that Node's
  // actual key order doesn't accidentally shadow that explicit entry.
  const fallback = nodeEntry(value.default, condition, explicit);
  for (const [key, branch] of Object.entries(value)) {
    if (key !== 'node' && key !== condition) continue;
    const entry = nodeEntry(branch, condition, explicit || key === condition);
    if (entry?.check === 'file' && fallback?.check === 'load') {
      // A Node fallback must not shadow a Web import. Resolve, but never load it.
      return { ...entry, check: 'resolve' };
    }
    if (entry !== undefined) return entry;
  }
  return fallback;
}

function inspectPackage({ directory, manifest }, errors) {
  const entries = { esm: [], cjs: [] };
  const paths = new Map();
  function checkFiles(subpath, value, conditions) {
    if (typeof value === 'string') {
      const target = resolve(directory, value);
      try {
        if (!statSync(target).isFile()) throw new Error('not a file');
        paths.set(value, realpathSync(target));
      } catch (error) {
        errors.push(
          `${manifest.name} ${subpath} [${conditions.join('.') || 'file'}] ${value}: ${error.message}`,
        );
      }
    } else if (Array.isArray(value)) {
      for (const branch of value) checkFiles(subpath, branch, conditions);
    } else if (value) {
      for (const [key, branch] of Object.entries(value)) {
        checkFiles(subpath, branch, [...conditions, key]);
      }
    }
  }

  const exports = manifest.exports;
  const subpaths = Object.keys(exports).some(key => key.startsWith('.'))
    ? exports
    : { '.': exports };
  for (const [subpath, value] of Object.entries(subpaths)) {
    checkFiles(subpath, value, []);
    const spec = manifest.name + subpath.slice(1);
    for (const [mode, condition] of [
      ['esm', 'import'],
      ['cjs', 'require'],
    ]) {
      const entry = nodeEntry(value, condition);
      if (entry && entry.check !== 'file') {
        entries[mode].push([
          spec,
          paths.get(entry.target) ?? resolve(directory, entry.target),
          entry.check === 'load',
        ]);
      }
    }
  }
  if (manifest.main) checkFiles('.', manifest.main, ['main']);
  return Object.entries(entries)
    .filter(([, specs]) => specs.length)
    .map(([mode, specs]) => ({ directory, mode, specs }));
}

const completion = '::exports-loaded::';
async function load({ directory, mode }, specs) {
  const esm = mode === 'esm';
  const source = `
    ${esm ? "import { fileURLToPath } from 'node:url';" : ''}
    for (const [spec, expected, execute] of JSON.parse(process.argv[1])) {
      const actual = ${esm ? 'fileURLToPath(import.meta.resolve(spec))' : 'require.resolve(spec)'};
      if (actual !== expected) throw new Error(spec + ': expected ' + expected + ', but Node resolved ' + actual);
      if (execute) ${esm ? 'await import(spec)' : 'require(spec)'};
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
      .reduce(
        (sum, job) => sum + job.specs.filter(([, , execute]) => execute).length,
        0,
      );
  console.log(
    `Checked ${packages.length} package${packages.length === 1 ? '' : 's'} (${count('esm')} ESM, ${count('cjs')} CJS exports).`,
  );
  if (errors.length) {
    console.error(
      'Check the declared exports and build outputs. For CommonJS-only dependencies, prefer a working CommonJS entry over deep imports of upstream build files.',
    );
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
