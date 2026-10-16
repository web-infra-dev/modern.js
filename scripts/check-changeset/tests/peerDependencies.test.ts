import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  utimes,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from '@rstest/core';
import { syncPeerDependencies } from '../src/peerDependencies';

const workspaces: string[] = [];

afterEach(async () => {
  await Promise.all(
    workspaces.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
  );
});

async function createWorkspace(version: string) {
  const repoDir = await mkdtemp(join(tmpdir(), 'modern-js-check-changeset-'));
  workspaces.push(repoDir);

  const runtimeDir = join(repoDir, 'packages/runtime');
  const pluginDir = join(repoDir, 'packages/plugin-i18n');
  const runtimePath = join(runtimeDir, 'package.json');
  const pluginPath = join(pluginDir, 'package.json');
  const pluginPackage = {
    name: '@modern-js/plugin-i18n',
    version,
    peerDependencies: {
      '@modern-js/runtime': 'workspace:^3.9.3',
      react: '>=18.3.1',
    },
    peerDependenciesMeta: {
      react: { optional: true },
    },
    dependencies: { 'external-library': '^1.0.0' },
    devDependencies: { '@modern-js/runtime': 'workspace:*' },
  };

  await Promise.all([
    mkdir(runtimeDir, { recursive: true }),
    mkdir(pluginDir, { recursive: true }),
    writeFile(join(repoDir, 'package.json'), JSON.stringify({ private: true })),
    writeFile(
      join(repoDir, 'pnpm-workspace.yaml'),
      "packages:\n  - 'packages/*'\n",
    ),
  ]);
  await Promise.all([
    writeFile(
      runtimePath,
      JSON.stringify({ name: '@modern-js/runtime', version }),
    ),
    writeFile(pluginPath, JSON.stringify(pluginPackage, null, 2)),
  ]);

  return { repoDir, runtimePath, pluginPath, pluginPackage };
}

test.each(['3.9.4', '3.10.0'])(
  'synchronizes local peer ranges after a release to %s',
  async version => {
    const { repoDir, runtimePath, pluginPath, pluginPackage } =
      await createWorkspace(version);
    const originalRuntime = await readFile(runtimePath, 'utf8');

    await syncPeerDependencies(repoDir);

    const updated = JSON.parse(await readFile(pluginPath, 'utf8'));
    expect(updated).toEqual({
      ...pluginPackage,
      peerDependencies: {
        ...pluginPackage.peerDependencies,
        '@modern-js/runtime': `workspace:^${version}`,
      },
    });
    expect(await readFile(runtimePath, 'utf8')).toBe(originalRuntime);
  },
);

test('does not rewrite package files when peer ranges are already synchronized', async () => {
  const { repoDir, pluginPath } = await createWorkspace('3.10.0');
  await syncPeerDependencies(repoDir);

  const original = await readFile(pluginPath, 'utf8');
  const earlier = new Date('2000-01-01T00:00:00.000Z');
  await utimes(pluginPath, earlier, earlier);
  const before = await stat(pluginPath);

  await syncPeerDependencies(repoDir);

  expect(await readFile(pluginPath, 'utf8')).toBe(original);
  expect((await stat(pluginPath)).mtimeMs).toBe(before.mtimeMs);
});
