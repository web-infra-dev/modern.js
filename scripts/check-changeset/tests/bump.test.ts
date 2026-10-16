import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, expect, test } from '@rstest/core';

const projectDir = resolve(__dirname, '..');
const projectRequire = createRequire(join(projectDir, 'package.json'));
const tsxCli = projectRequire.resolve('tsx/cli');
const bumpPath = join(projectDir, 'src/bump.ts');
const workspaces: string[] = [];

afterEach(async () => {
  await Promise.all(
    workspaces.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
  );
});

async function createWorkspace({
  releaseType = 'patch',
  releasePackage = '@modern-js/runtime',
  peerRange = 'workspace:^3.9.3',
} = {}) {
  const repoDir = await mkdtemp(join(tmpdir(), 'modern-js-bump-'));
  workspaces.push(repoDir);
  const scriptDir = join(repoDir, 'scripts/check-changeset');
  const runtimeDir = join(repoDir, 'packages/runtime');
  const pluginDir = join(repoDir, 'packages/plugin-i18n');
  const runtimePath = join(runtimeDir, 'package.json');
  const pluginPath = join(pluginDir, 'package.json');
  const config = JSON.parse(
    await readFile(resolve(projectDir, '../../.changeset/config.json'), 'utf8'),
  );

  await Promise.all([
    mkdir(scriptDir, { recursive: true }),
    mkdir(runtimeDir, { recursive: true }),
    mkdir(pluginDir, { recursive: true }),
    mkdir(join(repoDir, '.changeset')),
    writeFile(
      join(repoDir, 'package.json'),
      JSON.stringify({ name: 'bump-test-workspace', private: true }),
    ),
    writeFile(
      join(repoDir, 'pnpm-workspace.yaml'),
      "packages:\n  - 'packages/*'\n",
    ),
  ]);
  await Promise.all([
    writeFile(
      runtimePath,
      JSON.stringify({ name: '@modern-js/runtime', version: '3.9.3' }),
    ),
    writeFile(
      pluginPath,
      JSON.stringify({
        name: '@modern-js/plugin-i18n',
        version: '3.9.3',
        peerDependencies: { '@modern-js/runtime': peerRange },
      }),
    ),
    writeFile(
      join(repoDir, '.changeset/config.json'),
      JSON.stringify({ ...config, changelog: false }),
    ),
    writeFile(
      join(repoDir, '.changeset/test-release.md'),
      `---\n"${releasePackage}": ${releaseType}\n---\n\nTest release.\n`,
    ),
  ]);

  return { scriptDir, runtimePath, pluginPath };
}

function runBump(scriptDir: string, args: string[] = []) {
  const result = spawnSync(process.execPath, [tsxCli, bumpPath, ...args], {
    cwd: scriptDir,
    encoding: 'utf8',
    timeout: 20000,
  });
  if (result.error) {
    throw result.error;
  }
  return result;
}

async function readPackage(path: string) {
  return JSON.parse(await readFile(path, 'utf8'));
}

test.each([
  { releaseType: 'patch', expectedVersion: '3.9.4' },
  { releaseType: 'minor', expectedVersion: '3.10.0' },
])(
  'bumps $releaseType versions and synchronizes peers without a major release',
  async ({ releaseType, expectedVersion }) => {
    const { scriptDir, runtimePath, pluginPath } = await createWorkspace({
      releaseType,
    });

    const result = runBump(scriptDir);

    expect({
      status: result.status,
      output: result.stdout + result.stderr,
    }).toMatchObject({ status: 0 });
    expect((await readPackage(runtimePath)).version).toBe(expectedVersion);
    expect(await readPackage(pluginPath)).toMatchObject({
      version: expectedVersion,
      peerDependencies: {
        '@modern-js/runtime': `workspace:^${expectedVersion}`,
      },
    });
  },
);

test('forwards snapshot arguments and synchronizes peers to snapshot versions', async () => {
  const { scriptDir, runtimePath, pluginPath } = await createWorkspace();

  const result = runBump(scriptDir, ['--snapshot', 'peer-test']);

  expect({
    status: result.status,
    output: result.stdout + result.stderr,
  }).toMatchObject({ status: 0 });
  const runtime = await readPackage(runtimePath);
  expect(runtime.version).toMatch(/^0\.0\.0-peer-test-\d{14}$/);
  expect(await readPackage(pluginPath)).toMatchObject({
    version: runtime.version,
    peerDependencies: {
      '@modern-js/runtime': `workspace:^${runtime.version}`,
    },
  });
});

test('does not synchronize peers when changeset version fails', async () => {
  const { scriptDir, pluginPath } = await createWorkspace({
    releasePackage: '@modern-js/missing',
    peerRange: 'workspace:^3.8.0',
  });
  const original = await readFile(pluginPath, 'utf8');

  const result = runBump(scriptDir);

  expect(result.status).not.toBe(0);
  expect(result.stdout + result.stderr).toContain('@modern-js/missing');
  expect(await readFile(pluginPath, 'utf8')).toBe(original);
});

test.each(['--help', '--help=true'])(
  'shows %s without synchronizing peers',
  async help => {
    const { scriptDir, pluginPath } = await createWorkspace({
      peerRange: 'workspace:^3.8.0',
    });
    const original = await readFile(pluginPath, 'utf8');

    const result = runBump(scriptDir, [help]);

    expect({
      status: result.status,
      output: result.stdout + result.stderr,
    }).toMatchObject({ status: 0 });
    expect(result.stdout).toContain('Usage');
    expect(await readFile(pluginPath, 'utf8')).toBe(original);
  },
);
