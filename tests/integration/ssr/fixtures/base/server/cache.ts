import type { CacheOption, Container } from '@modern-js/runtime/server';

class MyContainter implements Container {
  map: Map<string, string> = new Map();

  get(key: string) {
    return this.map.get(key);
  }

  set(key: string, value: string): this {
    this.map.set(key, value);
    return this;
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  delete(key: string): boolean {
    return this.map.delete(key);
  }
}

export const customContainer: Container = new MyContainter();

export const cacheOption: CacheOption = {
  maxAge: 500,
  staleWhileRevalidate: 1000,
};
