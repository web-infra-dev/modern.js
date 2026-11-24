import { beforeEach, describe, expect, it, rs } from '@rstest/core';

rs.mock('fs/promises', () => ({
  access: () => Promise.resolve(),
  lstat: () =>
    Promise.resolve({
      mtimeMs: 1,
      size: 4,
    }),
  readFile: rs.fn(() => Promise.resolve('test')),
}));

import { readFile } from 'fs/promises';
import { FileCache } from './fileCache';

describe('modern serve static file cache', async () => {
  beforeEach(() => {
    rs.mocked(readFile).mockClear();
  });

  it('should cache file', async () => {
    const cache = new FileCache();
    const result = await cache.getFile('test.txt');
    expect(result?.content).toBe('test');

    await cache.getFile('test.txt');
    expect(readFile).toHaveBeenCalledTimes(1);
  });

  it('evicts the least recently used file when full', async () => {
    const cache = new FileCache(4);

    await cache.getFile('first.txt');
    await cache.getFile('second.txt');
    await cache.getFile('first.txt');

    expect(readFile).toHaveBeenCalledTimes(3);
  });
});
