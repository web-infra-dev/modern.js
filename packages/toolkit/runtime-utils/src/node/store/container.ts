import LRU from 'lru-cache';

export interface Container<V = string> {
  get: (key: string) => V | undefined;

  set: (key: string, value: V) => this;

  has: (key: string) => boolean;

  delete: (key: string) => boolean;

  forEach?: (callbackFn: (v: V, k: string, container: this) => void) => void;
}

interface MemoryContainerOptions {
  /** The maximum size of the cache, unit(MB). The default of value is 256. */
  max?: number;
}

export class MemoryContainer<V = unknown> implements Container<V> {
  private static BYTE: number = 1;

  private static KB: number = 1024 * this.BYTE;

  private static MB: number = 1024 * this.KB;

  private cache: LRU<string, V>;

  constructor({ max }: MemoryContainerOptions = {}) {
    this.cache = new LRU({
      max: (max || 256) * MemoryContainer.MB,
    });
  }

  get(key: string): V | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: V): this {
    this.cache.set(key, value);
    return this;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    const exist = this.has(key);
    if (exist) {
      this.cache.del(key);
    }
    return exist;
  }

  forEach(callbackFn: (v: V, k: string, container: this) => void) {
    this.cache.forEach((value, key) => {
      callbackFn(value, key, this);
    });
  }
}
