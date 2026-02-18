import { beforeAll, describe, expect, it, vi } from 'vitest';
import { FileCache } from './fileCache';

beforeAll(() => {
  vi.mock('fs-extra', () => ({
    default: {
      pathExists: () => {
        return true;
      },
      lstat: () => {
        return {
          mtimeMs: Date.now(),
          size: 4,
        };
      },
      readFile: () => {
        return 'test';
      },
    },
  }));
});

describe('modern serve static file cache', async () => {
  it('should cache file', async () => {
    const cache = new FileCache();
    const result = await cache.getFile('test.txt');
    expect(result?.content).toBe('test');
  });
});
