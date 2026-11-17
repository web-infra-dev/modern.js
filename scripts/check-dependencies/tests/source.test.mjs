import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { runCheck } from '../check-source.mjs';
import { createIndexSnapshot } from '../git-index.mjs';
import { checkSourceDependencies } from '../source-dependencies.mjs';
import { affectedPackages, readWorkspace } from '../workspace.mjs';

const execute = promisify(execFile);
const fields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

async function fixture(
  t,
  {
    code = "import { value } from 'fixture-lib'; export { value };",
    field,
    installed = true,
    dependency = 'fixture-lib',
  } = {},
) {
  const root = await mkdtemp(join(tmpdir(), 'source-dependency-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  async function write(path, content) {
    const file = join(root, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(
      file,
      typeof content === 'string' ? content : JSON.stringify(content),
    );
  }
  await write('pnpm-workspace.yaml', "packages:\n  - 'packages/*'\n");
  await write('package.json', {
    name: 'fixture-root',
    private: true,
    dependencies: { 'fixture-lib': '1.0.0' },
  });
  await write('packages/a/package.json', {
    name: '@fixture/a',
    version: '1.0.0',
    ...(field ? { [field]: { [dependency]: '1.0.0' } } : {}),
  });
  await write('packages/a/tsconfig.base.json', {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      baseUrl: '.',
      paths: { '@local/*': ['src/*'], '@other/*': ['../b/src/*'] },
    },
  });
  await write('packages/a/tsconfig.json', {
    extends: './tsconfig.base.json',
    include: ['src'],
  });
  await write('packages/a/src/index.ts', code);
  await write('packages/a/src/value.ts', 'export const value = 1;');
  await write('packages/b/package.json', {
    name: '@fixture/b',
    version: '1.0.0',
    main: 'src/value.ts',
  });
  await write('packages/b/src/value.ts', 'export const value = 1;');
  if (installed) {
    await write('node_modules/fixture-lib/package.json', {
      name: 'fixture-lib',
      version: '1.0.0',
      main: 'index.js',
      types: 'index.d.ts',
    });
    await write('node_modules/fixture-lib/index.js', 'exports.value = 1;');
    await write(
      'node_modules/fixture-lib/index.d.ts',
      'export interface Info { value: number }\nexport declare const value: number;',
    );
  }
  await mkdir(join(root, 'node_modules/@fixture'), { recursive: true });
  await symlink(
    join(root, 'packages/b'),
    join(root, 'node_modules/@fixture/b'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  const global = join(root, 'empty-git-config');
  await writeFile(global, '');
  const env = {
    ...process.env,
    GIT_CONFIG_GLOBAL: global,
    GIT_CONFIG_NOSYSTEM: '1',
  };
  delete env.GIT_CONFIG_COUNT;
  delete env.GIT_CONFIG_PARAMETERS;
  delete env.GIT_INDEX_FILE;
  async function git(...args) {
    return (await execute('git', args, { cwd: root, env })).stdout;
  }
  async function commit() {
    await git('init');
    await git('add', 'package.json', 'pnpm-workspace.yaml', 'packages');
    await git(
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      'commit',
      '-m',
      'fixture',
    );
  }
  return { root, write, git, commit, env };
}

function errors(result) {
  return result.diagnostics.filter(
    diagnostic => diagnostic.severity === 'error',
  );
}

for (const installed of [true, false]) {
  test(`undeclared external package is found when installed=${installed}`, async t => {
    const { root } = await fixture(t, { installed });
    const result = await checkSourceDependencies(root);
    assert.equal(errors(result).length, 1);
    assert.equal(errors(result)[0].dependency, 'fixture-lib');
    assert.equal(errors(result)[0].path, 'packages/a/src/index.ts');
  });
}

for (const field of fields) {
  for (const installed of [true, false]) {
    test(`${field} is accepted when installed=${installed}`, async t => {
      const { root } = await fixture(t, { field, installed });
      assert.equal(errors(await checkSourceDependencies(root)).length, 0);
    });
  }
}

for (const code of [
  "import type { Info } from 'fixture-lib'; export type Public = Info;",
  "export type Public = import('fixture-lib').Info;",
  "export { value } from 'fixture-lib';",
  "export async function load() { return import('fixture-lib'); }",
  "const value = require('fixture-lib'); export { value };",
  "const value = require.resolve('fixture-lib'); export { value };",
  "import value = require('fixture-lib'); export { value };",
]) {
  test(`extracts dependency: ${code}`, async t => {
    const { root } = await fixture(t, { code });
    assert.equal(errors(await checkSourceDependencies(root)).length, 1);
  });
}

for (const code of [
  "import { value } from './value'; export { value };",
  "import { value } from '@local/value'; export { value };",
  "import { readFile } from 'node:fs/promises'; export { readFile };",
  "import { readFile } from 'fs/promises'; export { readFile };",
  "import { value } from '@fixture/a'; export { value };",
]) {
  test(`local, builtin or self reference: ${code}`, async t => {
    const { root } = await fixture(t, { code });
    assert.equal(errors(await checkSourceDependencies(root)).length, 0);
  });
}

for (const reference of [
  '@other/value',
  '../..' + '/b/src/value',
  '@fixture/b',
]) {
  for (const declared of [false, true]) {
    test(`cross-workspace ${reference}, declared=${declared}`, async t => {
      const { root } = await fixture(t, {
        code: `import { value } from '${reference}'; export { value };`,
        ...(declared
          ? { field: 'dependencies', dependency: '@fixture/b' }
          : {}),
      });
      const findings = errors(await checkSourceDependencies(root));
      assert.equal(findings.length, declared ? 0 : 1);
      if (!declared) assert.equal(findings[0].dependency, '@fixture/b');
    });
  }
}

for (const declared of [false, true]) {
  test(`type provider @types, declared=${declared}`, async t => {
    const { root, write } = await fixture(t, {
      code: "import type { Info } from 'fixture-types'; export type Public = Info;",
      ...(declared
        ? { field: 'devDependencies', dependency: '@types/fixture-types' }
        : {}),
    });
    await write('node_modules/@types/fixture-types/package.json', {
      name: '@types/fixture-types',
      types: 'index.d.ts',
    });
    await write(
      'node_modules/@types/fixture-types/index.d.ts',
      'export interface Info { value: number }',
    );
    assert.equal(
      errors(await checkSourceDependencies(root)).length,
      declared ? 0 : 1,
    );
  });
}

test('unresolved local path and configured alias are warnings, not missing npm declarations', async t => {
  const { root, write } = await fixture(t, {
    code: "import value from '@local/missing'; export { value };",
  });
  await write(
    'packages/a/src/local.ts',
    "import value from './missing'; export { value };",
  );
  const result = await checkSourceDependencies(root);
  assert.equal(errors(result).length, 0);
  assert.equal(
    result.diagnostics.filter(d => d.rule === 'unresolved-reference').length,
    2,
  );
});

test('fixtures and tests are excluded, comments and ordinary strings are not imports', async t => {
  const { root, write } = await fixture(t, {
    code: "// import value from 'missing-lib'\nexport const text = \"require('missing-lib')\";",
  });
  await write(
    'packages/a/src/fixtures/example.ts',
    "import value from 'missing-lib';",
  );
  await write(
    'packages/a/src/example.test.ts',
    "import value from 'missing-lib';",
  );
  const result = await checkSourceDependencies(root);
  assert.equal(errors(result).length, 0);
  assert.equal(result.files, 3);
});

test('manifest-only staged removal checks unchanged source, not an unstaged manifest repair', async t => {
  const { root, write, git, commit } = await fixture(t, {
    field: 'dependencies',
  });
  await commit();
  await write('packages/a/package.json', { name: '@fixture/a' });
  await git('add', 'packages/a/package.json');
  await write('packages/a/package.json', {
    name: '@fixture/a',
    dependencies: { 'fixture-lib': '1.0.0' },
  });
  const before = await git('status', '--porcelain');
  const indexBefore = await readFile(join(root, '.git/index'));
  const result = await runCheck(root, { staged: true });
  assert.deepEqual(await readFile(join(root, '.git/index')), indexBefore);
  assert.equal(result.packages, 1);
  assert.equal(errors(result).length, 1);
  assert.equal(errors(await checkSourceDependencies(root)).length, 0);
  assert.equal(await git('status', '--porcelain'), before);
});

test('unstaged source repair does not hide a staged missing dependency', async t => {
  const { root, write, git, commit } = await fixture(t, {
    code: 'export const value = 1;',
  });
  await commit();
  await write(
    'packages/a/src/index.ts',
    "import value from 'fixture-lib'; export { value };",
  );
  await git('add', 'packages/a/src/index.ts');
  await write('packages/a/src/index.ts', 'export const value = 1;');
  assert.equal(errors(await runCheck(root, { staged: true })).length, 1);
  assert.equal(errors(await checkSourceDependencies(root)).length, 0);
});

test('unstaged new source files are not part of the commit', async t => {
  const { root, write, git, commit } = await fixture(t, {
    code: 'export const value = 1;',
  });
  await commit();
  await write('packages/a/src/index.ts', 'export const value = 2;');
  await git('add', 'packages/a/src/index.ts');
  await write(
    'packages/a/src/untracked.ts',
    "import value from 'missing-lib';",
  );
  assert.equal(errors(await runCheck(root, { staged: true })).length, 0);
  assert.equal(errors(await checkSourceDependencies(root)).length, 1);
});

test('source deletion and rename select the affected package', async t => {
  const { root, git, commit } = await fixture(t, { field: 'dependencies' });
  await commit();
  await git('rm', 'packages/a/src/value.ts');
  await git('mv', 'packages/a/src/index.ts', 'packages/a/src/renamed.ts');
  const result = await runCheck(root, { staged: true });
  assert.equal(result.packages, 1);
  assert.equal(result.files, 1);
  assert.equal(errors(result).length, 0);
});

test('deleting a package manifest with source remaining fails rather than skipping the package', async t => {
  const { root, git, commit } = await fixture(t, { field: 'dependencies' });
  await commit();
  await git('rm', 'packages/a/package.json');
  await assert.rejects(
    runCheck(root, { staged: true }),
    /packages\/a\/package.json is missing/,
  );
});

test('shared config follows the index, including workspace node_modules links', async t => {
  const { root, write, git, commit } = await fixture(t, {
    code: "import { value } from '@local/value'; export { value };",
  });
  await write('packages/config/package.json', { name: '@fixture/config' });
  const config = target => ({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      baseUrl: '.',
      paths: { '@local/*': [target] },
    },
  });
  await write('packages/config/tsconfig.json', config('../a/src/*'));
  await symlink(
    join(root, 'packages/config'),
    join(root, 'node_modules/@fixture/config'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  await write('packages/a/tsconfig.json', {
    extends: '@fixture/config/tsconfig.json',
    include: ['src'],
  });
  await commit();
  await write('packages/config/tsconfig.json', config('../b/src/*'));
  await git('add', 'packages/config/tsconfig.json');
  await write('packages/config/tsconfig.json', config('../a/src/*'));
  const result = await runCheck(root, { staged: true });
  assert.equal(result.packages, 2);
  assert.equal(errors(result).length, 1);
  assert.equal(errors(result)[0].dependency, '@fixture/b');
  assert.equal(errors(await checkSourceDependencies(root)).length, 0);
});

test('snapshot cleanup and no staged changes', async t => {
  const { root, commit } = await fixture(t, { field: 'dependencies' });
  await commit();
  assert.equal((await runCheck(root, { staged: true })).packages, 0);
  const snapshot = await createIndexSnapshot(root);
  assert.equal(
    JSON.parse(
      await readFile(join(snapshot.root, 'packages/a/package.json'), 'utf8'),
    ).name,
    '@fixture/a',
  );
  await snapshot.cleanup();
  await assert.rejects(
    readFile(join(snapshot.root, 'packages/a/package.json')),
    { code: 'ENOENT' },
  );
});

test('initial commit and source changes in a path containing spaces', async t => {
  const { root, write, git } = await fixture(t, {
    code: 'export const value = 1;',
  });
  await write(
    'packages/a/src/with space.ts',
    "import value from 'fixture-lib'; export { value };",
  );
  await git('init');
  await git('add', 'package.json', 'pnpm-workspace.yaml', 'packages');
  assert.equal(errors(await runCheck(root, { staged: true })).length, 1);
});

test('CLI uses exit codes 0, 1 and 2, including staged checks', async t => {
  const { root, write, git, commit, env } = await fixture(t, {
    code: 'export const value = 1;',
  });
  const tools = dirname(dirname(fileURLToPath(import.meta.url)));
  for (const file of [
    'check-source.mjs',
    'git-index.mjs',
    'source-dependencies.mjs',
    'workspace.mjs',
  ]) {
    await write(
      `scripts/check-dependencies/${file}`,
      await readFile(join(tools, file), 'utf8'),
    );
  }
  await symlink(
    join(tools, 'node_modules'),
    join(root, 'scripts/check-dependencies/node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  await commit();
  async function cli(...args) {
    try {
      const result = await execute(
        process.execPath,
        [join(root, 'scripts/check-dependencies/check-source.mjs'), ...args],
        { cwd: root, env },
      );
      return { code: 0, ...result };
    } catch (error) {
      return { code: error.code, stdout: error.stdout, stderr: error.stderr };
    }
  }
  assert.equal((await cli('--json')).code, 0);
  await write(
    'packages/a/src/index.ts',
    "import value from 'fixture-lib'; export { value };",
  );
  await git('add', 'packages/a/src/index.ts');
  await write('packages/a/src/index.ts', 'export const value = 1;');
  const staged = await cli('--staged', '--json');
  assert.equal(staged.code, 1);
  assert.equal(
    JSON.parse(staged.stdout).diagnostics[0].dependency,
    'fixture-lib',
  );
  assert.equal((await cli()).code, 0);
  await write('packages/a/tsconfig.json', '{ invalid JSON');
  const invalid = await cli();
  assert.equal(invalid.code, 2);
  assert.match(invalid.stderr, /Source dependency check failed/);
});

test('shared/root manifest and config changes expand the affected scope', async t => {
  const { root } = await fixture(t, { field: 'dependencies' });
  const packages = await readWorkspace(root);
  assert.equal(
    affectedPackages(['package.json'], packages).length,
    packages.length,
  );
  assert.equal(
    affectedPackages(['pnpm-workspace.yaml'], packages).length,
    packages.length,
  );
  assert.equal(
    affectedPackages(['packages/a/tsconfig.base.json'], packages).length,
    packages.length,
  );
  assert.equal(
    affectedPackages(['packages/a/package.json'], packages).length,
    1,
  );
  assert.equal(affectedPackages(['README.md'], packages).length, 0);
});
