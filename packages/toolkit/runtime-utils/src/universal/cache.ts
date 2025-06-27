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
  key: string;
  params: any[];
  result: any;
  /**
   * Cache miss reason:
   * 1: Caching is disabled for the current request
   * 2: Item not found in cache
   * 3: Item found in cache but has expired
   * 4: Failed to parse data from cache
   * 5: Execution error
   */
  reason?: number;
}

export interface Container {
  get: (key: string) => Promise<string | undefined | null>;
  set: (key: string, value: string, options?: { ttl?: number }) => Promise<any>;
  has: (key: string) => Promise<boolean>;
  delete: (key: string) => Promise<boolean>;
  clear: () => Promise<void>;
}

class MemoryContainer implements Container {
  private lru: LRUCache<string, string>;

  constructor(options?: { maxSize?: number }) {
    this.lru = new LRUCache<string, string>({
      maxSize: options?.maxSize ?? CacheSize.GB,
      sizeCalculation: (value: string): number => {
        return value.length * 2;
      },
      updateAgeOnGet: true,
      updateAgeOnHas: true,
    });
  }

  async get(key: string): Promise<string | undefined> {
    return this.lru.get(key);
  }

  async set(
    key: string,
    value: string,
    options?: { ttl?: number },
  ): Promise<void> {
    if (options?.ttl) {
      this.lru.set(key, value, { ttl: options.ttl * 1000 });
    } else {
      this.lru.set(key, value);
    }
  }

  async has(key: string): Promise<boolean> {
    return this.lru.has(key);
  }

  async delete(key: string): Promise<boolean> {
    return this.lru.delete(key);
  }

  async clear(): Promise<void> {
    this.lru.clear();
  }
}

interface CacheOptions<T extends (...args: any[]) => any> {
  tag?: string | string[];
  maxAge?: number;
  revalidate?: number;
  getKey?: (...args: Parameters<T>) => string;
  customKey?: (options: {
    params: Parameters<T>;
    fn: T;
    generatedKey: string;
  }) => string;
  onCache?: (info: CacheStatsInfo) => void;
  unstable_shouldCache?: (info: {
    params: Parameters<T>;
    result: Awaited<ReturnType<T>>;
  }) => boolean | Promise<boolean>;
}

interface CacheConfig {
  maxSize?: number;
  container?: Container;
  unstable_shouldDisable?: ({
    request,
  }: {
    request: Request;
  }) => boolean | Promise<boolean>;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  tags?: string[];
}

const isServer = typeof window === 'undefined';
const requestCacheMap = new WeakMap<Request, Map<any, any>>();

const TAG_PREFIX = 'tag:';
const CACHE_PREFIX = 'modernjs_cache:';

const ongoingRevalidations = new Map<string, Promise<any>>();

let storage: Container | undefined;
let cacheConfig: CacheConfig = {
  maxSize: CacheSize.GB,
};

function getStorage(): Container {
  if (storage) {
    return storage;
  }

  if (cacheConfig.container) {
    storage = cacheConfig.container;
  } else {
    storage = new MemoryContainer({
      maxSize: cacheConfig.maxSize,
    });
  }

  return storage;
}

export function configureCache(config: CacheConfig): void {
  cacheConfig = {
    ...cacheConfig,
    ...config,
  };
  storage = undefined;
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

function generateStableFunctionId(fn: Function): string {
  const fnString = fn.toString();
  let hash = 0;
  for (let i = 0; i < fnString.length; i++) {
    const char = fnString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return `fn_${fn.name || 'anonymous'}_${Math.abs(hash).toString(36)}`;
}

export function cache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options?: CacheOptions<T>,
): T {
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
      try {
        const {
          tag,
          maxAge = CacheTime.MINUTE * 5,
          revalidate = 0,
          customKey,
          onCache,
          getKey,
          unstable_shouldCache,
        } = options;

        let missReason: number | undefined;

        const currentStorage = getStorage();
        const now = Date.now();
        const tags = tag ? (Array.isArray(tag) ? tag : [tag]) : [];

        const genKey = getKey ? getKey(...args) : generateKey(args);
        let finalKey: string;
        if (customKey) {
          finalKey = customKey({
            params: args,
            fn,
            generatedKey: genKey,
          });
        } else {
          const functionId = generateStableFunctionId(fn);
          finalKey = `${functionId}:${genKey}`;
        }

        const storageKey = `${CACHE_PREFIX}${finalKey}`;

        let shouldDisableCaching = false;
        if (isServer && cacheConfig.unstable_shouldDisable) {
          const asyncStorage = getAsyncLocalStorage();
          const request = asyncStorage?.useContext()?.request;
          if (request) {
            shouldDisableCaching = await cacheConfig.unstable_shouldDisable({
              request,
            });
          }
        }

        if (!shouldDisableCaching) {
          const cachedRaw = await currentStorage.get(storageKey);
          if (cachedRaw) {
            try {
              const cached = JSON.parse(cachedRaw) as CacheItem<any>;
              const age = now - cached.timestamp;

              if (age < maxAge) {
                onCache?.({
                  status: 'hit',
                  key: finalKey,
                  params: args,
                  result: cached.data,
                });
                return cached.data;
              }

              if (revalidate > 0 && age < maxAge + revalidate) {
                onCache?.({
                  status: 'stale',
                  key: finalKey,
                  params: args,
                  result: cached.data,
                });

                if (!ongoingRevalidations.has(storageKey)) {
                  const revalidationPromise = (async () => {
                    try {
                      const newData = await fn(...args);

                      let shouldCache = true;
                      if (unstable_shouldCache) {
                        shouldCache = await unstable_shouldCache({
                          params: args,
                          result: newData,
                        });
                      }

                      if (shouldCache) {
                        await setCacheItem(
                          currentStorage,
                          storageKey,
                          newData,
                          tags,
                          maxAge,
                          revalidate,
                        );
                      }
                    } catch (error) {
                      if (isServer) {
                        const asyncStorage = getAsyncLocalStorage();
                        asyncStorage
                          ?.useContext()
                          ?.monitors?.error((error as Error).message);
                      } else {
                        console.error('Background revalidation failed:', error);
                      }
                    } finally {
                      ongoingRevalidations.delete(storageKey);
                    }
                  })();

                  ongoingRevalidations.set(storageKey, revalidationPromise);
                }

                return cached.data;
              }
              missReason = 3; // cache-expired
            } catch (error) {
              console.warn('Failed to parse cached data:', error);
              missReason = 4; // cache-parse-error
            }
          } else {
            missReason = 2; // cache-not-found
          }
        } else {
          missReason = 1; // cache-disabled
        }

        const data = await fn(...args);

        if (!shouldDisableCaching) {
          let shouldCache = true;
          if (unstable_shouldCache) {
            shouldCache = await unstable_shouldCache({
              params: args,
              result: data,
            });
          }

          if (shouldCache) {
            await setCacheItem(
              currentStorage,
              storageKey,
              data,
              tags,
              maxAge,
              revalidate,
            );
          }
        }

        onCache?.({
          status: 'miss',
          key: finalKey,
          params: args,
          result: data,
          reason: missReason,
        });

        return data;
      } catch (error) {
        console.warn(
          'Cache operation failed, falling back to direct execution:',
          error,
        );
        const data = await fn(...args);

        try {
          onCache?.({
            status: 'miss',
            key: 'cache_failed',
            params: args,
            result: data,
            reason: 5,
          });
        } catch (callbackError) {
          console.warn('Failed to call onCache callback:', callbackError);
        }

        return data;
      }
    } else {
      console.warn(
        'The cache function will not work because it runs on the browser and there are no options are provided.',
      );
      return fn(...args);
    }
  }) as T;
}

async function setCacheItem(
  storage: Container,
  storageKey: string,
  data: any,
  tags: string[],
  maxAge: number,
  revalidate: number,
): Promise<void> {
  const newItem: CacheItem<any> = {
    data,
    timestamp: Date.now(),
    tags: tags.length > 0 ? tags : undefined,
  };

  const ttl = (maxAge + revalidate) / 1000;
  await storage.set(storageKey, JSON.stringify(newItem), {
    ttl: ttl > 0 ? ttl : undefined,
  });

  await updateTagRelationships(storage, storageKey, tags);
}

async function updateTagRelationships(
  storage: Container,
  storageKey: string,
  tags: string[],
): Promise<void> {
  for (const tag of tags) {
    const tagStoreKey = `${TAG_PREFIX}${tag}`;
    const keyListJson = await storage.get(tagStoreKey);
    const keyList: string[] = keyListJson ? JSON.parse(keyListJson) : [];
    if (!keyList.includes(storageKey)) {
      keyList.push(storageKey);
    }
    await storage.set(tagStoreKey, JSON.stringify(keyList));
  }
}

async function removeKeyFromTags(
  storage: Container,
  storageKey: string,
  tags: string[],
): Promise<void> {
  for (const tag of tags) {
    const tagStoreKey = `${TAG_PREFIX}${tag}`;
    const keyListJson = await storage.get(tagStoreKey);
    if (keyListJson) {
      try {
        const keyList: string[] = JSON.parse(keyListJson);
        const updatedKeyList = keyList.filter(key => key !== storageKey);
        if (updatedKeyList.length > 0) {
          await storage.set(tagStoreKey, JSON.stringify(updatedKeyList));
        } else {
          await storage.delete(tagStoreKey);
        }
      } catch (error) {
        console.warn(`Failed to parse tag key list for tag ${tag}:`, error);
      }
    }
  }
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

export async function revalidateTag(tag: string): Promise<void> {
  const currentStorage = getStorage();
  const tagStoreKey = `${TAG_PREFIX}${tag}`;

  const keyListJson = await currentStorage.get(tagStoreKey);
  if (keyListJson) {
    try {
      const keyList: string[] = JSON.parse(keyListJson);

      // For each cache key, we need to:
      // 1. Get the cache item to find its associated tags
      // 2. Remove this key from all other tag relationships
      // 3. Delete the cache item itself
      for (const cacheKey of keyList) {
        const cachedRaw = await currentStorage.get(cacheKey);
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as CacheItem<any>;
            if (cached.tags) {
              // Remove this cache key from all its associated tags (except the current one being revalidated)
              const otherTags = cached.tags.filter(t => t !== tag);
              await removeKeyFromTags(currentStorage, cacheKey, otherTags);
            }
          } catch (error) {
            console.warn(
              'Failed to parse cached data while revalidating:',
              error,
            );
          }
        }

        // Delete the cache item itself
        await currentStorage.delete(cacheKey);
      }

      // Delete the tag relationship record
      await currentStorage.delete(tagStoreKey);
    } catch (error) {
      console.warn('Failed to parse tag key list:', error);
    }
  }
}

export async function clearStore(): Promise<void> {
  const currentStorage = getStorage();
  await currentStorage.clear();
  storage = undefined;
  ongoingRevalidations.clear();
}
