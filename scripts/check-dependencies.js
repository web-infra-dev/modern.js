const { execFile } = require('node:child_process');
const { mkdtemp, mkdir, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { promisify } = require('node:util');

const exec = promisify(execFile);
const root = path.resolve(__dirname, '..');
const ignoreDeps = [
  'fs-extra',
  'react-router-dom',
  'tailwindcss',
  'tsconfig-paths',
  'typescript',
  'lru-cache',
  'tsx',
  // MCP SDK requires zod >=4.2, while existing BFF APIs still use zod 3.
  'zod',
];

async function check() {
  let snapshot;
  try {
    let directory = root;
    if (process.argv.includes('--staged')) {
      snapshot = await mkdtemp(path.join(os.tmpdir(), 'dependency-manifests-'));
      directory = snapshot;
      const { stdout } = await exec('git', ['ls-files', '-z'], { cwd: root });
      const files = stdout
        .split('\0')
        .filter(
          file =>
            file === 'package.json' ||
            file === 'pnpm-workspace.yaml' ||
            file.endsWith('/package.json'),
        );
      await Promise.all(
        files.map(async file => {
          const { stdout: content } = await exec('git', ['show', `:${file}`], {
            cwd: root,
          });
          const target = path.join(snapshot, file);
          await mkdir(path.dirname(target), { recursive: true });
          await writeFile(target, content);
        }),
      );
    }
    // Resolve the installed binary instead of npx: hooks must never download tools.
    const executable = path.resolve(
      path.dirname(require.resolve('check-dependency-version-consistency')),
      '../bin/check-dependency-version-consistency.js',
    );
    const args = [
      executable,
      directory,
      ...ignoreDeps.flatMap(dep => ['--ignore-dep', dep]),
      // Examples intentionally track published packages rather than workspace versions.
      '--ignore-package-pattern',
      '^@examples/',
    ];
    const { stdout, stderr } = await exec(process.execPath, args, {
      cwd: root,
      maxBuffer: 20 * 1024 * 1024,
    });
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
  } finally {
    if (snapshot) await rm(snapshot, { recursive: true, force: true });
  }
}

check().catch(error => {
  console.error(error.stdout || error.stderr || error);
  process.exitCode = 1;
});
