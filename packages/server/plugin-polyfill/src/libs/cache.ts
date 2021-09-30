import crypto from 'crypto';
import LRUCache from 'lru-cache';

type CacheQueryOptions = {
  features: string;
  minify: boolean;
  name: string;
  version: string;
};

const KB = 1024;
const MB = 1024 * KB;

const keyCache = new LRUCache<string, string>(10000);
export const generateCacheKey = (options: CacheQueryOptions) => {
  const { name, version, features, minify } = options;

  const str = `${name}-${version}-${Number(minify)}-${features}`;
  const matched = keyCache.get(str);
  if (matched) {
    return matched;
  }

  const hash = crypto
    .createHmac('sha256', '^polyfill$')
    .update(str)
    .digest('hex');
  keyCache.set(str, hash);
  return hash;
};

export default class Cache {
  private readonly caches: LRUCache<string, string>;

  constructor() {
    this.caches = new LRUCache({
      max: 200 * MB,
      length: v => v.length,
    });
  }

  public get(hash: string) {
    return this.caches.get(hash);
  }

  public set(hash: string, content: string) {
    this.caches.set(hash, content);
  }
}
