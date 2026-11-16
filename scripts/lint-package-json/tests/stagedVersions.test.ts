import { execFile } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from '@rstest/core';

const exec = promisify(execFile);

it('checks version consistency from the index without running shell commands or fetching tools', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'dependency-versions-'));
  try {
    await mkdir(path.join(root, 'scripts'));
    await mkdir(path.join(root, 'packages/tool'), { recursive: true });
    await mkdir(path.join(root, 'packages/example'), { recursive: true });
    await copyFile(
      path.resolve(__dirname, '../../check-dependencies.js'),
      path.join(root, 'scripts/check-dependencies.js'),
    );
    await symlink(
      path.resolve(__dirname, '../../../node_modules'),
      path.join(root, 'node_modules'),
      'junction',
    );
    const ignored = [
      'fs-extra',
      'react-router-dom',
      'tailwindcss',
      'tsconfig-paths',
      'typescript',
      'lru-cache',
      'tsx',
      'zod',
    ];
    const first = Object.fromEntries(
      [...ignored, 'foo'].map(name => [name, '1.0.0']),
    );
    const second = Object.fromEntries(
      [...ignored, 'foo'].map(name => [name, '2.0.0']),
    );
    await writeFile(
      path.join(root, 'package.json'),
      JSON.stringify({
        name: 'root',
        private: true,
        workspaces: ['packages/*'],
        dependencies: first,
      }),
    );
    await writeFile(
      path.join(root, 'packages/tool/package.json'),
      JSON.stringify({ name: 'tool', dependencies: second }),
    );
    await writeFile(
      path.join(root, 'packages/example/package.json'),
      '{"name":"@examples/fixture","dependencies":{"foo":"3.0.0"}}',
    );
    await exec('git', ['init', '--quiet'], { cwd: root });
    await exec(
      'git',
      [
        'add',
        'package.json',
        'packages/tool/package.json',
        'packages/example/package.json',
      ],
      { cwd: root },
    );
    await writeFile(
      path.join(root, 'packages/tool/package.json'),
      JSON.stringify({
        name: 'tool',
        dependencies: { ...second, foo: '1.0.0' },
      }),
    );
    await expect(
      exec(process.execPath, ['scripts/check-dependencies.js', '--staged'], {
        cwd: root,
      }),
    ).rejects.toMatchObject({ code: 1 });
    const result = await exec(
      process.execPath,
      ['scripts/check-dependencies.js'],
      { cwd: root },
    ).catch(error => {
      console.error(error.stderr);
      throw error;
    });
    expect(result.stderr).toBe('');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
