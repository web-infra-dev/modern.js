import { mkdtemp, writeFile, rm, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, it } from '@rstest/core';
import { FileCache } from './fileCache';
it('invalidates cached files after changes and deletion', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'mf-file-cache-'));
  try {
    const file = path.join(directory, 'remote.js');
    const cache = new FileCache(100);
    await writeFile(file, 'version one');
    expect((await cache.getFile(file))?.content).toBe('version one');
    await writeFile(file, 'version two');
    const future = new Date(Date.now() + 2000);
    await utimes(file, future, future);
    expect((await cache.getFile(file))?.content).toBe('version two');
    await rm(file);
    expect(await cache.getFile(file)).toBeNull();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
