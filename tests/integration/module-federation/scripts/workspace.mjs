import {
  cp,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  stat,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Link packages individually so node_modules/.cache remains local to each copy.
async function linkDependencies(source, target) {
  await mkdir(target, { recursive: true });
  for (const entry of await readdir(source)) {
    if (entry.startsWith('.') && !['.bin', '.pnpm'].includes(entry)) continue;
    const original = path.join(source, entry);
    const directory = (await stat(original)).isDirectory();
    await symlink(
      original,
      path.join(target, entry),
      directory ? (process.platform === 'win32' ? 'junction' : 'dir') : 'file',
    );
  }
}

// Each test file owns a writable copy: framework CI runs files concurrently,
// and the adapter's dev manifest middleware requires its default dist path.
export async function createWorkspace(options = {}) {
  const source = fileURLToPath(new URL('../', import.meta.url));
  const workspace = await mkdtemp(path.join(tmpdir(), 'modern-mf-'));
  const excluded = new Set([
    'node_modules',
    'dist',
    'dist-v2',
    '.modern-js',
    '.rsbuild',
  ]);
  try {
    await linkDependencies(
      path.resolve(source, '../../../node_modules'),
      path.join(workspace, 'node_modules'),
    );
    for (const name of ['host', 'provider', 'nested', 'library']) {
      await cp(path.join(source, name), path.join(workspace, name), {
        recursive: true,
        filter: filename => !excluded.has(path.basename(filename)),
      });
      await linkDependencies(
        path.join(source, name, 'node_modules'),
        path.join(workspace, name, 'node_modules'),
      );
    }
    if (options.service) {
      for (const name of ['service-ssr', 'service-csr']) {
        await cp(
          path.join(source, 'fixtures/service-app/host'),
          path.join(workspace, name),
          { recursive: true },
        );
        for (const filename of ['package.json', 'tsconfig.json'])
          await cp(
            path.join(source, 'provider', filename),
            path.join(workspace, name, filename),
          );
        await linkDependencies(
          path.join(source, 'provider/node_modules'),
          path.join(workspace, name, 'node_modules'),
        );
      }
    }
    await cp(path.join(source, 'ports.ts'), path.join(workspace, 'ports.ts'));
    await cp(
      path.join(source, 'package.json'),
      path.join(workspace, 'package.json'),
    );
    return workspace;
  } catch (error) {
    await rm(workspace, { recursive: true, force: true });
    throw error;
  }
}
