import { createCache, destroyCache } from '../spr';
import { CacheContext } from '../type';
import { errorConfiguration } from './error-configuration';
import { cacheabelAry } from './cacheable';
import { matchedCacheableAry } from './matched-cache';

const createCacheConfig = (config: any = {}) => ({
  excludes: null,
  includes: null,
  interval: 10,
  staleLimit: false,
  level: 0,
  fallback: false,
  matches: null,
  ...config,
});

jest.setTimeout(60000);

describe('cache', () => {
  it('should cache correctly', async () => {
    destroyCache();
    const cache = createCache();
    const context: CacheContext = {
      entry: '',
      pathname: '',
      query: {},
      headers: {},
    };
    const content = 'hello';
    const cacheConfig = createCacheConfig();

    await cache.set(context, content, cacheConfig, true);
    const cacheResult = await cache.get(context);
    expect(cacheResult).not.toBe(null);
    expect(cacheResult?.content).toBe('hello');
  });

  it('should ignore cache set when cache config not exist', async () => {
    destroyCache();
    destroyCache();
    const cache = createCache();
    const context: CacheContext = {
      entry: '',
      pathname: '',
      query: {},
      headers: {},
    };
    const content = 'hello';

    const shouldCache = await cache.set(context, content, null as any, true);
    expect(shouldCache).toBe(false);
  });

  it('should calcual cache key error', async () => {
    destroyCache();
    const cache = createCache();
    const content = 'hello';

    for (const config of errorConfiguration) {
      const cacheConfig = createCacheConfig(config);
      const tmpEntry = Math.random().toString();
      const context: CacheContext = {
        entry: tmpEntry,
        pathname: '',
        query: {},
        headers: {},
      };
      const shouldCache = await cache.set(context, content, cacheConfig);
      expect(shouldCache).toBe(false);
    }
  });

  it('should get nothing for diff requestKey', async () => {
    destroyCache();
    const cache = createCache();
    const context: CacheContext = {
      entry: '',
      pathname: '',
      query: {},
      headers: {},
    };
    const content = 'hello';
    const cacheConfig = createCacheConfig({
      level: 1,
      includes: { query: ['name'] },
    });

    await cache.set(context, content, cacheConfig, true);

    const context_req: CacheContext = {
      entry: '',
      pathname: '/home',
      query: {},
      headers: {},
    };

    const cacheResult = await cache.get(context_req);
    expect(cacheResult).toBe(null);
  });

  it('should get nothing for diff cacheHash', async () => {
    destroyCache();
    const cache = createCache();
    const context: CacheContext = {
      entry: '',
      pathname: '',
      query: {},
      headers: {},
    };
    const content = 'hello';
    const cacheConfig = createCacheConfig({
      level: 1,
      includes: { query: ['name'] },
    });

    await cache.set(context, content, cacheConfig, true);

    const context_req: CacheContext = {
      entry: '',
      pathname: '',
      query: { name: 'zll' },
      headers: {},
    };

    const cacheResult = await cache.get(context_req);
    expect(cacheResult).toBe(null);
  });

  it('should get cache correctly', async () => {
    destroyCache();
    const cache = createCache();
    for (const cacheable of cacheabelAry) {
      const context: CacheContext = {
        entry: '',
        pathname: cacheable.requestOpt.url,
        query: cacheable.requestOpt.query || {},
        headers: cacheable.requestOpt.headers || {},
      };
      const cacheConfig = createCacheConfig(cacheable.cacheConfig || {});

      await cache.set(context, cacheable.content, cacheConfig, true);
      const cacheResult = await cache.get(context);
      expect(cacheResult?.content).toBe(cacheable.content);
    }
  });

  it('should match cache correctly', async () => {
    destroyCache();
    const cache = createCache();
    for (const cacheable of matchedCacheableAry) {
      const [baseCacheable, matchOne, ...other] = cacheable;
      const { requestOpt = {} as any, cacheConfig, content } = baseCacheable;
      const context: CacheContext = {
        entry: '',
        pathname: requestOpt.url,
        query: requestOpt.query,
        headers: requestOpt.headers,
      };
      await cache.set(context, content!, createCacheConfig(cacheConfig), true);

      const matchContext: CacheContext = {
        entry: '',
        pathname: matchOne.url!,
        query: matchOne.query!,
        headers: matchOne.headers!,
      };
      const cacheResult = await cache.get(matchContext);
      expect(cacheResult?.content).toBe(content);

      for (const notMatch of other) {
        const notMatchContext: CacheContext = {
          entry: '',
          pathname: notMatch.url!,
          query: notMatch.query!,
          headers: notMatch.headers!,
        };
        const nothing = await cache.get(notMatchContext);
        expect(nothing).toBe(null);
      }
    }
  });

  it('should stale cache correctly', async () => {
    destroyCache();
    const cache = createCache();
    const context: CacheContext = {
      entry: '',
      pathname: '',
      query: {},
      headers: {},
    };
    const config = createCacheConfig({ interval: 5 });
    const content = 'hello';
    const shouldCache = await cache.set(context, content, config, true);
    expect(shouldCache.value).toBe(true);

    const freshResult = await cache.get(context);
    expect(freshResult?.isStale).toBe(false);

    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 6000);
    });

    const staleResult = await cache.get(context);
    expect(staleResult?.isStale).toBe(true);
  });

  it('should garbage cache correctly', async () => {
    destroyCache();
    const cache = createCache();
    const context: CacheContext = {
      entry: '',
      pathname: '',
      query: {},
      headers: {},
    };
    const config = createCacheConfig({
      interval: 3,
      staleLimit: 8,
    });
    const content = 'hello';
    const shouldCache = await cache.set(context, content, config, true);
    expect(shouldCache.value).toBe(true);

    const freshResult = await cache.get(context);
    expect(freshResult?.isGarbage).toBe(false);

    await new Promise<void>(resolve => {
      setTimeout(() => {
        resolve();
      }, 10000);
    });

    const staleResult = await cache.get(context);
    expect(staleResult?.isGarbage).toBe(true);
  });
});
