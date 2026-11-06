import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
export async function fingerprint(repo) {
  const dist = createHash('sha256');
  for (const name of [
    'runtime/plugin-runtime',
    'runtime/plugin-i18n',
    'toolkit/plugin',
    'solutions/app-tools',
  ]) {
    const folder = path.join(repo, 'packages', name, 'dist');
    for (const file of (await readdir(folder, { recursive: true })).sort()) {
      try {
        const bytes = await readFile(path.join(folder, file));
        dist.update(name + '/' + file);
        dist.update(bytes);
      } catch (error) {
        if (error.code !== 'EISDIR') throw error;
      }
    }
  }
  return {
    repo,
    sha: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repo,
      encoding: 'utf8',
    }).trim(),
    distSha256: dist.digest('hex'),
    lockSha256: createHash('sha256')
      .update(await readFile(path.join(repo, 'pnpm-lock.yaml')))
      .digest('hex'),
    startedAt: new Date().toISOString(),
    node: process.version,
  };
}
