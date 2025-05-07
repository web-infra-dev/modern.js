import { LRUCache } from 'lru-cache';
import { getAsyncLocalStorage } from './async_storage';

export const CacheSize = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
} as const;

export const CacheTime = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

export type CacheStatus = 'hit' | 'stale' | 'miss';

export interface CacheStatsInfo {
  status: CacheStatus;
  key: string | symbol;
  params: any[];
  result: any;
}

interface CacheOptions {
  tag?: string | string[];
  maxAge?: number;
  revalidate?: number;
  getKey?: <Args extends any[]>(...args: Args) => string;
  customKey?: <Args extends any[]>(options: {
    params: Args;
    fn: (...args: Args) => any;
    generatedKey: string;
  }) => string | symbol;
  onCache?: (info: CacheStatsInfo) => void;
}

interface CacheConfig {
  maxSize?: number;
  unstable_shouldDisable?: ({
    request,
  }: {
    request: Request;
  }) => boolean | Promise<boolean>;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  isRevalidating?: boolean;
}

const isServer = typeof window === 'undefined';
const requestCacheMap = new WeakMap<Request, Map<any, any>>();

let lruCache:
  | LRUCache<Function | string | symbol, Map<string, CacheItem<any>>>
  | undefined;
let cacheConfig: CacheConfig = {
  maxSize: CacheSize.GB,
};

const tagKeyMap = new Map<string, Set<Function | string | symbol>>();

function addTagKeyRelation(tag: string, key: Function | string | symbol) {
  let keys = tagKeyMap.get(tag);
  if (!keys) {
    keys = new Set();
    tagKeyMap.set(tag, keys);
  }
  keys.add(key);
}

export function configureCache(config: CacheConfig): void {
  cacheConfig = {
    ...cacheConfig,
    ...config,
  };
}

function getLRUCache() {
  if (!lruCache) {
    lruCache = new LRUCache<
      Function | string | symbol,
      Map<string, CacheItem<any>>
    >({
      maxSize: cacheConfig.maxSize ?? CacheSize.GB,
      sizeCalculation: (value: Map<string, CacheItem<any>>): number => {
        if (!value.size) {
          return 1;
        }

        let size = 0;
        for (const [k, item] of value.entries()) {
          size += k.length * 2;
          size += estimateObjectSize(item.data);
          size += 8;
        }
        return size;
      },
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }
  return lruCache;
}

function estimateObjectSize(data: unknown): number {
  const type = typeof data;

  if (type === 'number') return 8;
  if (type === 'boolean') return 4;
  if (type === 'string') return Math.max((data as string).length * 2, 1);
  if (data === null || data === undefined) return 1;

  if (ArrayBuffer.isView(data)) {
    return Math.max(data.byteLength, 1);
  }

  if (Array.isArray(data)) {
    return Math.max(
      data.reduce((acc, item) => acc + estimateObjectSize(item), 0),
      1,
    );
  }

  if (data instanceof Map || data instanceof Set) {
    return 1024;
  }

  if (data instanceof Date) {
    return 8;
  }

  if (type === 'object') {
    return Math.max(
      Object.entries(data).reduce(
        (acc, [key, value]) => acc + key.length * 2 + estimateObjectSize(value),
        0,
      ),
      1,
    );
  }

  return 1;
}

export function generateKey(args: unknown[]): string {
  return JSON.stringify(args, (_, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce((result: Record<string, unknown>, key) => {
          result[key] = value[key];
          return result;
        }, {});
    }
    return value;
  });
}

export function cache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: CacheOptions,
): T {
  const {
    tag = 'default',
    maxAge = CacheTime.MINUTE * 5,
    revalidate = 0,
    customKey,
    onCache,
    getKey,
  } = options || {};
  const store = getLRUCache();

  const tags = Array.isArray(tag) ? tag : [tag];

  const getCacheKey = (args: Parameters<T>, generatedKey: string) => {
    return customKey ? customKey({ params: args, fn, generatedKey }) : fn;
  };

  return (async (...args: Parameters<T>) => {
    if (isServer && typeof options === 'undefined') {
      const storage = getAsyncLocalStorage();
      const request = storage?.useContext()?.request;
      if (request) {
        let shouldDisableCaching = false;
        if (cacheConfig.unstable_shouldDisable) {
          shouldDisableCaching = await cacheConfig.unstable_shouldDisable({
            request,
          });
        }

        if (shouldDisableCaching) {
          return fn(...args);
        }

        let requestCache = requestCacheMap.get(request);
        if (!requestCache) {
          requestCache = new Map();
          requestCacheMap.set(request, requestCache);
        }

        let fnCache = requestCache.get(fn) as Map<string, any>;
        if (!fnCache) {
          fnCache = new Map();
          requestCache.set(fn, fnCache);
        }

        const key = generateKey(args);
        if (fnCache.has(key)) {
          return fnCache.get(key);
        }

        const promise = fn(...args);
        fnCache.set(key, promise);

        try {
          const data = await promise;
          return data;
        } catch (error) {
          fnCache.delete(key);
          throw error;
        }
      }
    } else if (typeof options !== 'undefined') {
      const genKey = getKey ? getKey(...args) : generateKey(args);
      const now = Date.now();

      const cacheKey = getCacheKey(args, genKey);
      const finalKey = typeof cacheKey === 'function' ? genKey : cacheKey;

      tags.forEach(t => addTagKeyRelation(t, cacheKey));

      let cacheStore = store.get(cacheKey);
      if (!cacheStore) {
        cacheStore = new Map();
      }

      const storeKey =
        customKey && typeof cacheKey === 'symbol' ? 'symbol-key' : genKey;

      let shouldDisableCaching = false;
      if (isServer && cacheConfig.unstable_shouldDisable) {
        const storage = getAsyncLocalStorage();
        const request = storage?.useContext()?.request;
        if (request) {
          shouldDisableCaching = await cacheConfig.unstable_shouldDisable({
            request,
          });
        }
      }

      const cached = cacheStore.get(storeKey);
      if (cached && !shouldDisableCaching) {
        const age = now - cached.timestamp;

        if (age < maxAge) {
          if (onCache) {
            onCache({
              status: 'hit',
              key: finalKey,
              params: args,
              result: cached.data,
            });
          }
          return cached.data;
        }

        if (revalidate > 0 && age < maxAge + revalidate) {
          if (onCache) {
            onCache({
              status: 'stale',
              key: finalKey,
              params: args,
              result: cached.data,
            });
          }

          if (!cached.isRevalidating) {
            cached.isRevalidating = true;
            Promise.resolve().then(async () => {
              try {
                const newData = await fn(...args);
                cacheStore!.set(storeKey, {
                  data: newData,
                  timestamp: Date.now(),
                  isRevalidating: false,
                });

                store.set(cacheKey, cacheStore!);
              } catch (error) {
                cached.isRevalidating = false;
                if (isServer) {
                  const storage = getAsyncLocalStorage();
                  storage
                    ?.useContext()
                    ?.monitors?.error((error as Error).message);
                } else {
                  console.error('Background revalidation failed:', error);
                }
              }
            });
          }
          return cached.data;
        }
      }

      const data = await fn(...args);

      if (!shouldDisableCaching) {
        cacheStore.set(storeKey, {
          data,
          timestamp: now,
          isRevalidating: false,
        });

        store.set(cacheKey, cacheStore);
      }

      if (onCache) {
        onCache({
          status: 'miss',
          key: finalKey,
          params: args,
          result: data,
        });
      }

      return data;
    } else {
      console.warn(
        'The cache function will not work because it runs on the browser and there are no options are provided.',
      );
      return fn(...args);
    }
  }) as T;
}

export function withRequestCache<
  T extends (req: Request, ...args: any[]) => Promise<any>,
>(handler: T): T {
  if (!isServer) {
    return handler;
  }

  return (async (req: Request, ...args: Parameters<T>) => {
    const storage = getAsyncLocalStorage();
    return storage!.run({ request: req }, () => handler(req, ...args));
  }) as T;
}

export function revalidateTag(tag: string): void {
  const keys = tagKeyMap.get(tag);
  if (keys) {
    keys.forEach(key => {
      lruCache?.delete(key);
    });
  }
}

export function clearStore(): void {
  lruCache?.clear();
  lruCache = undefined;
  tagKeyMap.clear();
}
