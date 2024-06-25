import { Container, CacheControl } from '@modern-js/types';
import { getCacheResult } from '../../src/plugins/render/ssrCache';
import type { SSRServerContext } from '../../src/types';

function sleep(timeout: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(null);
    }, timeout);
  });
}

class MyContainer implements Container {
  cache: Map<string, string> = new Map();

  async get(key: string) {
    return this.cache.get(key);
  }

  async set(key: string, value: string) {
    this.cache.set(key, value);

    return this;
  }

  async has(key: string) {
    return this.cache.has(key);
  }

  async delete(key: string) {
    return this.cache.delete(key);
  }
}

const container = new MyContainer();

const ssrContext: SSRServerContext = {} as any;

describe('test cacheManager', () => {
  it('should return cache', async () => {
    let counter = 0;
    const cacheControl: CacheControl = {
      maxAge: 120,
      staleWhileRevalidate: 100,
    };
    const req = new Request('http://localhost:8080/a', {
      headers: { ua: 'mock_ua' },
    });

    const render = async () => `Hello_${counter++}`;

    const result1 = await getCacheResult(req, {
      cacheControl,
      render,
      ssrContext,
      container,
    });

    expect(result1.data).toEqual(`Hello_0`);

    await sleep(50);
    const result2 = await getCacheResult(req, {
      cacheControl,
      render,
      ssrContext,
      container,
    });
    expect(result2.data).toEqual(`Hello_0`);

    await sleep(100);
    const result3 = await getCacheResult(req, {
      cacheControl,
      render,
      ssrContext,
      container,
    });
    expect(result3.data).toEqual(`Hello_0`);
  });

  it('should revalidate the cache', async () => {
    let counter = 0;
    const cacheControl: CacheControl = {
      maxAge: 100,
      staleWhileRevalidate: 100,
    };
    const req = new Request('http://localhost:8080/b', {
      headers: { ua: 'mock_ua' },
    });
    const render = async () => `Hello_${counter++}`;

    const result1 = await getCacheResult(req, {
      cacheControl,
      render,
      ssrContext,
      container,
    });
    expect(result1.data).toEqual(`Hello_0`);

    await sleep(150);
    const result2 = await getCacheResult(req, {
      cacheControl,
      render,
      ssrContext,
      container,
    });
    expect(result2.data).toEqual(`Hello_0`);

    await sleep(50);
    const result3 = await getCacheResult(req, {
      cacheControl,
      render,
      ssrContext,
      container,
    });
    expect(result3.data).toEqual(`Hello_1`);
  });

  it('should invalidate the ssr, then render on next req', async () => {
    let counter = 0;
    const cacheControl: CacheControl = {
      maxAge: 500,
      staleWhileRevalidate: 20,
    };
    const req = new Request('http://localhost:8080/c', {
      headers: { ua: 'mock_ua' },
    });
    const render = async () => `Hello_${counter++}`;

    const result1 = await getCacheResult(req, {
      cacheControl,
      render,
      ssrContext,
      container,
    });
    expect(result1.data).toEqual(`Hello_0`);

    await sleep(600);
    const result2 = await getCacheResult(req, {
      cacheControl,
      render,
      ssrContext,
      container,
    });
    expect(result2.data).toEqual(`Hello_1`);

    await sleep(600);
    const result3 = await getCacheResult(req, {
      cacheControl,
      render,
      ssrContext,
      container,
    });
    expect(result3.data).toEqual(`Hello_2`);
  });
});
