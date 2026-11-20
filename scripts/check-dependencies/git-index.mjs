import { execFile } from 'node:child_process';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  realpath,
  rm,
  stat,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import { contains, exists, readWorkspace } from './workspace.mjs';

const execute = promisify(execFile);
const gitOptions = { maxBuffer: 32 * 1024 * 1024 };

export async function git(root, args, env = process.env) {
  return (await execute('git', args, { ...gitOptions, cwd: root, env })).stdout;
}

export async function stagedChanges(root) {
  return (
    await git(root, ['diff', '--cached', '--name-only', '--no-renames', '-z'])
  )
    .split('\0')
    .filter(Boolean);
}

async function linkInstalledModules(repository, snapshot, packages) {
  async function linkEntries(original, target, scoped = false) {
    if (!(await exists(original))) return;
    await mkdir(target, { recursive: true });
    for (const entry of await readdir(original, { withFileTypes: true })) {
      if (entry.name.startsWith('.') && entry.name !== '.pnpm') continue;
      const from = join(original, entry.name);
      const to = join(target, entry.name);
      if (!scoped && entry.name.startsWith('@')) {
        await linkEntries(from, to, true);
        continue;
      }
      let installed;
      try {
        installed = await realpath(from);
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }
      const withinRepository = contains(repository, installed);
      const path = relative(repository, installed);
      // Installed third-party packages remain read-only. Workspace packages and
      // compiler configs resolve to their staged counterparts, never the worktree.
      const workspaceTarget =
        withinRepository && !path.split(sep).includes('node_modules');
      const destination = workspaceTarget ? resolve(snapshot, path) : installed;
      const directory = (await stat(installed)).isDirectory();
      await symlink(
        destination,
        to,
        directory
          ? process.platform === 'win32'
            ? 'junction'
            : 'dir'
          : 'file',
      );
    }
  }
  // Package directories are independent. Bound IO concurrency to avoid serial
  // setup overhead on large workspaces without opening every path at once.
  const batchSize = 8;
  for (let offset = 0; offset < packages.length; offset += batchSize) {
    const results = await Promise.allSettled(
      packages
        .slice(offset, offset + batchSize)
        .map(pkg =>
          linkEntries(
            join(repository, pkg.path, 'node_modules'),
            join(snapshot, pkg.path, 'node_modules'),
          ),
        ),
    );
    const failure = results.find(result => result.status === 'rejected');
    if (failure) throw failure.reason;
  }
}

export async function createIndexSnapshot(repository) {
  repository = await realpath(repository);
  const temporary = await mkdtemp(join(tmpdir(), 'modern-source-index-'));
  const root = join(temporary, 'workspace');
  const cleanup = () => rm(temporary, { recursive: true, force: true });
  try {
    // write-tree can update cache metadata in its index. Work on a copy so
    // even the user's index bytes remain unchanged, not just the staged diff.
    const index = resolve(
      repository,
      (await git(repository, ['rev-parse', '--git-path', 'index'])).trim(),
    );
    const env = { ...process.env, GIT_INDEX_FILE: join(temporary, 'index') };
    if (await exists(index)) await copyFile(index, env.GIT_INDEX_FILE);
    else await git(repository, ['read-tree', '--empty'], env);
    const tree = (await git(repository, ['write-tree'], env)).trim();
    let head;
    try {
      head = (await git(repository, ['rev-parse', '--verify', 'HEAD'])).trim();
    } catch (error) {
      if (error.code !== 128) throw error;
    }
    const changes = (
      await git(
        repository,
        head
          ? ['diff', '--name-only', '--no-renames', '-z', head, tree]
          : ['ls-tree', '-r', '--name-only', '-z', tree],
      )
    )
      .split('\0')
      .filter(Boolean);
    await mkdir(root);
    await git(
      repository,
      ['checkout-index', '--all', `--prefix=${root}${sep}`],
      env,
    );
    const packages = await readWorkspace(root);
    await linkInstalledModules(repository, root, packages);
    return { root, changes, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
