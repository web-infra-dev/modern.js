import LRU from 'lru-cache';
import { PageCache, PageCachesInterface } from '../type';

export class LRUCaches implements PageCachesInterface {
  caches: LRU<string, PageCache>;

  private readonly max: number;

  constructor(options: { max: number }) {
    this.max = options.max;
    this.caches = new LRU(this.max);
  }

  init() {
    return Promise.resolve();
  }

  public keys(): string[] {
    return this.caches.keys();
  }

  public get(key: string) {
    return Promise.resolve(this.caches.get(key) || null);
  }

  public peek(key: string) {
    return this.caches.peek(key) || null;
  }

  public set(key: string, cache: PageCache) {
    this.caches.set(key, cache);
    return Promise.resolve();
  }

  public del(key: string) {
    this.caches.del(key);
  }
}
