import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { ModulesCache, CACHE_LOCK_FILE } from '../src/install/modules-cache';

jest.mock('node-fetch');

describe('unbundle modules cache test', () => {
  const testCacheName = 'testCache';

  it('init', () => {
    const testCache = new ModulesCache(testCacheName);
    expect(testCache).toBeTruthy();
    expect(fs.existsSync(testCache.dir)).toBeTruthy();
    const cacheLockFilePath = path.join(testCache.dir, CACHE_LOCK_FILE);
    expect(fs.existsSync(cacheLockFilePath)).toBeTruthy();
  });

  it('clean', () => {
    const testCache = new ModulesCache(testCacheName);
    testCache.clean();
    expect(fs.existsSync(testCache.dir)).toBeTruthy();
    const cacheLockFilePath = path.join(testCache.dir, CACHE_LOCK_FILE);
    expect(fs.existsSync(cacheLockFilePath)).toBeTruthy();
  });

  it('requestRemoteCache', async () => {
    jest.mocked(fetch).mockImplementation(() => ({
      json: () =>
        Promise.resolve({
          code: 0,
          message: 'test',
          data: {
            content: 'test data content',
            meta: [],
          },
        }),
    }));
    const testCache = new ModulesCache('testCache');
    const result = await testCache.requestRemoteCache(
      'test-module',
      '1.1.0',
      {},
      'test.pdn',
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result).toBeTruthy();
    if (!result) {
      return;
    }
    expect(result.dependencies).toEqual([]);
    const fileContent = fs.readFileSync(result.file, 'utf-8');
    expect(fileContent).toEqual('test data content');
    testCache.clean();
  });
});
