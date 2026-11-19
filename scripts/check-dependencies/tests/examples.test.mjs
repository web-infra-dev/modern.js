import { spawnSync } from 'node:child_process';
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { afterEach, expect, test } from '@rstest/core';
import { readWorkspace } from '../workspace.mjs';

const repo = fileURLToPath(new URL('../../../', import.meta.url));
const checker = resolve(repo, 'scripts/check-dependencies/check-examples.mjs');
const require = createRequire(import.meta.url);
const changesets = require.resolve('@changesets/cli/bin.js');
const temporary = [];

async function write(root, path, content) {
  await mkdir(dirname(resolve(root, path)), { recursive: true });
  await writeFile(resolve(root, path), content);
}

async function workspace() {
  const root = await mkdtemp(resolve(tmpdir(), 'modern-example-policy-'));
  temporary.push(root);
  for (const path of ['pnpm-workspace.yaml', '.changeset/config.json']) {
    await write(root, path, await readFile(resolve(repo, path)));
  }
  const packages = await readWorkspace(repo);
  for (const pkg of packages) {
    await write(
      root,
      `${pkg.path}/package.json`,
      await readFile(resolve(pkg.directory, 'package.json')),
    );
  }
  // Changesets loads its configured changelog from the installed repository CLI.
  await symlink(
    resolve(repo, 'node_modules'),
    resolve(root, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  return root;
}

function check(root) {
  const result = spawnSync(process.execPath, [checker], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  return { status: result.status, output: result.stdout + result.stderr };
}

async function manifest(root, path, update) {
  const file = resolve(root, path, 'package.json');
  const value = JSON.parse(await readFile(file, 'utf8'));
  update(value);
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

afterEach(async () => {
  await Promise.all(
    temporary.splice(0).map(root => rm(root, { recursive: true })),
  );
});

test('checks actual top-level and nested workspace examples, not framework packages or fixtures', async () => {
  const root = await workspace();
  expect(check(root).status).toBe(0);
  const packages = await readWorkspace(root);
  const nested = packages.find(pkg =>
    pkg.path.startsWith('examples/module-federation/'),
  );
  expect(nested).toBeDefined();
  await manifest(root, nested.path, value => {
    value.optionalDependencies = { '@modern-js/runtime': 'canary' };
  });
  const result = check(root);
  expect(result.status).toBe(1);
  expect(result.output).toContain(
    `${nested.path}/package.json: optionalDependencies.@modern-js/runtime is "canary", expected "latest"`,
  );
  expect(result.output).not.toContain('packages/');
  expect(result.output).not.toContain('tests/integration/');
});

test('rejects the four numeric dependencies from the original og-image example', async () => {
  const root = await workspace();
  // PR #9169 originally installed these four Modern.js packages at 3.11.3.
  await manifest(root, 'examples/og-image', value => {
    value.dependencies['@modern-js/plugin-bff'] = '3.11.3';
    value.dependencies['@modern-js/runtime'] = '3.11.3';
    value.devDependencies['@modern-js/app-tools'] = '3.11.3';
    value.devDependencies['@modern-js/tsconfig'] = '3.11.3';
  });
  const result = check(root);
  expect(result.status).toBe(1);
  for (const [section, name] of [
    ['dependencies', '@modern-js/plugin-bff'],
    ['dependencies', '@modern-js/runtime'],
    ['devDependencies', '@modern-js/app-tools'],
    ['devDependencies', '@modern-js/tsconfig'],
  ]) {
    expect(result.output).toContain(
      `examples/og-image/package.json: ${section}.${name} is "3.11.3", expected "latest"`,
    );
  }
});

test('requires exactly latest across installation sections without restricting third parties or peers', async () => {
  const root = await workspace();
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies'];
  const values = ['3.12.0', '^3.12.0', 'canary', 'next', 'workspace:*'];
  await manifest(root, 'examples/og-image', value => {
    value.peerDependencies = { '@modern-js/runtime': 'workspace:*' };
    for (const section of sections) {
      value[section] ??= {};
      value[section]['third-party'] = '^1.2.3';
      value[section]['@modern-js/valid'] = 'latest';
      for (const [index, range] of values.entries()) {
        value[section][`@modern-js/invalid-${index}`] = range;
      }
    }
  });
  const result = check(root);
  expect(result.status).toBe(1);
  for (const section of sections) {
    for (const [index, range] of values.entries()) {
      expect(result.output).toContain(
        `examples/og-image/package.json: ${section}.@modern-js/invalid-${index} is ${JSON.stringify(range)}, expected "latest"`,
      );
    }
  }
  expect(result.output).not.toContain('third-party');
  expect(result.output).not.toContain('@modern-js/valid');
  expect(result.output).not.toContain('peerDependencies');
});

test('fails if an example name escapes the required Changesets exclusion or the exclusion is removed', async () => {
  const root = await workspace();
  await manifest(root, 'examples/og-image', value => {
    value.name = '@user/og-image';
  });
  let result = check(root);
  expect(result.status).toBe(1);
  expect(result.output).toContain(
    'examples/og-image/package.json: name "@user/og-image" is not covered by Changesets ignore "@examples/*"',
  );
  const file = resolve(root, '.changeset/config.json');
  const config = JSON.parse(await readFile(file, 'utf8'));
  await manifest(root, 'examples/og-image', value => {
    value.name = '@examples/og-image';
  });
  for (const ignore of [
    [],
    '@examples/*',
    ['@examples/*', '!@examples/og-image'],
  ]) {
    config.ignore = ignore;
    await writeFile(file, JSON.stringify(config));
    result = check(root);
    expect(result.status).toBe(1);
    expect(result.output).toContain(
      '.changeset/config.json: ignore must be ["@examples/*"]',
    );
  }
});

for (const snapshot of [false, true]) {
  test(`${snapshot ? 'canary snapshot' : 'ordinary'} bump advances the framework and leaves every example byte-identical`, async () => {
    const root = await workspace();
    const examples = (await readWorkspace(root)).filter(pkg =>
      pkg.path.startsWith('examples/'),
    );
    const before = new Map();
    for (const pkg of examples) {
      before.set(
        pkg.path,
        await readFile(resolve(pkg.directory, 'package.json')),
      );
    }
    const framework = 'packages/cli/adapter-rstest/package.json';
    const original = JSON.parse(
      await readFile(resolve(root, framework), 'utf8'),
    );
    await write(
      root,
      '.changeset/framework-patch.md',
      '---\n"@modern-js/adapter-rstest": patch\n---\n\nFramework patch.\n',
    );
    await write(
      root,
      '.changeset/ignored-example.md',
      '---\n"@examples/og-image": major\n---\n\nIgnored example version change.\n',
    );
    const result = spawnSync(
      process.execPath,
      [changesets, 'version', ...(snapshot ? ['--snapshot', 'canary'] : [])],
      { cwd: root, encoding: 'utf8' },
    );
    if (result.error) throw result.error;
    expect(result.status, result.stdout + result.stderr).toBe(0);
    const updated = JSON.parse(
      await readFile(resolve(root, framework), 'utf8'),
    );
    expect(updated.version).not.toBe(original.version);
    if (snapshot) expect(updated.version).toMatch(/^0\.0\.0-canary-\d+$/);
    else {
      const [major, minor, patch] = original.version.split('.').map(Number);
      expect(updated.version).toBe(`${major}.${minor}.${patch + 1}`);
    }
    for (const pkg of await readWorkspace(root)) {
      if (pkg.manifest.name?.startsWith('@modern-js/')) {
        expect(pkg.manifest.version, pkg.path).toBe(updated.version);
      }
    }
    for (const pkg of examples) {
      expect(
        await readFile(resolve(pkg.directory, 'package.json')),
        pkg.path,
      ).toEqual(before.get(pkg.path));
    }
    expect(check(root).status).toBe(0);
  }, 30000);
}
