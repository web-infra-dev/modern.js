import type { CacheOption, Container } from '@modern-js/runtime/server';

class MyContainer implements Container {
  map: Map<string, string> = new Map();

  async get(key: string) {
    return this.map.get(key);
  }

  async set(key: string, value: string): Promise<this> {
    this.map.set(key, value);
    return this;
  }

  async has(key: string): Promise<boolean> {
    return this.map.has(key);
  }

  async delete(key: string): Promise<boolean> {
    return this.map.delete(key);
  }
}

export const customContainer: Container = new MyContainer();

export const cacheOption: CacheOption = {
  maxAge: 50000,
  staleWhileRevalidate: 10000,
};
