import { Container } from '@modern-js/types';
import LRU from 'lru-cache';

interface MemoryContainerOptions {
  /** The maximum size of the cache, unit(MB). The default of value is 256. */
  max?: number;

  maxAge?: number;
}

/**
 * MemoryContainer, it use lur-cache as cahe layer.
 * It has a Time to Live, by default as 1 hour.
 */
export class MemoryContainer<K, V = unknown> implements Container<K, V> {
  private static BYTE: number = 1;

  private static KB: number = 1024 * this.BYTE;

  private static MB: number = 1024 * this.KB;

  private static ms: number = 1;

  private static second: number = this.ms * 1000;

  private static minute: number = this.second * 60;

  private static hour: number = this.minute * 60;

  private cache: LRU<K, V>;

  constructor({ max, maxAge }: MemoryContainerOptions = {}) {
    this.cache = new LRU({
      max: (max || 256) * MemoryContainer.MB,
      maxAge: maxAge || MemoryContainer.hour,
    });
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V, options?: { ttl?: number } | undefined): this {
    const ttl = options?.ttl;
    if (ttl) {
      // FIXME:
      // Is too many setTimout func?
      setTimeout(() => {
        this.delete(key);
      }, ttl);
    }

    this.cache.set(key, value);
    return this;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const exist = this.has(key);
    if (exist) {
      this.cache.del(key);
    }
    return exist;
  }

  forEach(callbackFn: (v: V, k: K, container: this) => void) {
    this.cache.forEach((value, key) => {
      callbackFn(value, key, this);
    });
  }
}
