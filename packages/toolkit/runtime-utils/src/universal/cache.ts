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

interface CacheOptions {
  tag?: string | string[];
  maxAge?: number;
  revalidate?: number;
}

interface CacheConfig {
  maxSize: number;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  isRevalidating?: boolean;
}

const isServer = typeof window === 'undefined';
const requestCacheMap = new WeakMap<Request, Map<string, any>>();

let lruCache:
  | LRUCache<(...args: any[]) => any, Map<string, CacheItem<any>>>
  | undefined;
let cacheConfig: CacheConfig = {
  maxSize: CacheSize.GB,
};

const tagFnMap = new Map<string, Set<(...args: any[]) => Promise<any>>>();

function addTagFnRelation(tag: string, fn: (...args: any[]) => Promise<any>) {
  let fns = tagFnMap.get(tag);
  if (!fns) {
    fns = new Set();
    tagFnMap.set(tag, fns);
  }
  fns.add(fn);
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
      (...args: any[]) => any,
      Map<string, CacheItem<any>>
    >({
      maxSize: cacheConfig.maxSize,
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
  } = options || {};
  const store = getLRUCache();

  const tags = Array.isArray(tag) ? tag : [tag];
  tags.forEach(t => addTagFnRelation(t, fn));

  return (async (...args: Parameters<T>) => {
    if (isServer && typeof options === 'undefined') {
      const storage = getAsyncLocalStorage();
      const request = storage?.useContext()?.request;
      if (request) {
        let requestCache = requestCacheMap.get(request);
        if (!requestCache) {
          requestCache = new Map();
          requestCacheMap.set(request, requestCache);
        }

        const key = generateKey(args);
        if (requestCache.has(key)) {
          return requestCache.get(key);
        }

        const promise = fn(...args);
        requestCache.set(key, promise);

        try {
          const data = await promise;
          return data;
        } catch (error) {
          requestCache.delete(key);
          throw error;
        }
      }
    } else if (typeof options !== 'undefined') {
      let tagCache = store.get(fn);
      if (!tagCache) {
        tagCache = new Map();
      }

      const key = generateKey(args);
      const cached = tagCache.get(key);
      const now = Date.now();

      if (cached) {
        const age = now - cached.timestamp;

        if (age < maxAge) {
          return cached.data;
        }

        if (revalidate > 0 && age < maxAge + revalidate * 1000) {
          if (!cached.isRevalidating) {
            cached.isRevalidating = true;
            Promise.resolve().then(async () => {
              try {
                const newData = await fn(...args);
                tagCache!.set(key, {
                  data: newData,
                  timestamp: Date.now(),
                  isRevalidating: false,
                });
                store.set(fn, tagCache);
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
      tagCache.set(key, {
        data,
        timestamp: now,
        isRevalidating: false,
      });

      store.set(fn, tagCache);

      return data;
    } else {
      console.warn(
        'The cache function will not work because it runs on the client and there are no options are provided.',
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
  const fns = tagFnMap.get(tag);
  if (fns) {
    fns.forEach(fn => {
      lruCache?.delete(fn);
    });
  }
}

export function clearStore(): void {
  lruCache?.clear();
  lruCache = undefined;
  tagFnMap.clear();
}
