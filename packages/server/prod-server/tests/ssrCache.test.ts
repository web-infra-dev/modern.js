import { IncomingMessage } from 'http';
import { Container, CacheControl } from '@modern-js/types';
import { CacheManager } from '../src/libs/render/ssrCache/manager';
import { SSRServerContext } from '../src/libs/render/type';

function sleep(timeout: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(null);
    }, timeout);
  });
}

class MyContainer implements Container {
  cache: Map<string, string> = new Map();

  get(key: string): string | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: string) {
    this.cache.set(key, value);

    return this;
  }

  has(key: string) {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

const container = new MyContainer();

const cacheManager = new CacheManager(container);

const ssrContext: SSRServerContext = {} as any;

describe('test cacheManager', () => {
  it('should return cache', async () => {
    let counter = 0;
    const cacheControl: CacheControl = {
      maxAge: 120,
      staleWhileRevalidate: 100,
    };
    const req = {
      url: '/a',
      header: {
        ua: 'mock_ua',
        host: 'http://localhost:8080',
      },
    } as unknown as IncomingMessage;
    const render = async () => `Hello_${counter++}`;

    const result1 = await cacheManager.getCacheResult(
      req,
      cacheControl,
      render,
      ssrContext,
    );

    expect(result1).toEqual(`Hello_0`);

    await sleep(50);
    const result2 = await cacheManager.getCacheResult(
      req,
      cacheControl,
      render,
      ssrContext,
    );
    expect(result2).toEqual(`Hello_0`);

    await sleep(100);
    const result3 = await cacheManager.getCacheResult(
      req,
      cacheControl,
      render,
      ssrContext,
    );
    expect(result3).toEqual(`Hello_0`);
  });

  it('should revalidate the cache', async () => {
    let counter = 0;
    const cacheControl: CacheControl = {
      maxAge: 100,
      staleWhileRevalidate: 100,
    };
    const req = {
      url: '/b',
      header: {
        ua: 'mock_ua',
        host: 'http://localhost:8080',
      },
    } as unknown as IncomingMessage;
    const render = async () => `Hello_${counter++}`;

    const result1 = await cacheManager.getCacheResult(
      req,
      cacheControl,
      render,
      ssrContext,
    );
    expect(result1).toEqual(`Hello_0`);

    await sleep(150);
    const result2 = await cacheManager.getCacheResult(
      req,
      cacheControl,
      render,
      ssrContext,
    );
    expect(result2).toEqual(`Hello_0`);

    await sleep(50);
    const result3 = await cacheManager.getCacheResult(
      req,
      cacheControl,
      render,
      ssrContext,
    );
    expect(result3).toEqual(`Hello_1`);
  });

  it('should invalidate the ssr, then render on next req', async () => {
    let counter = 0;
    const cacheControl: CacheControl = {
      maxAge: 500,
      staleWhileRevalidate: 20,
    };
    const req = {
      url: '/c',
      header: {
        ua: 'mock_ua',
        host: 'http://localhost:8080',
      },
    } as unknown as IncomingMessage;
    const render = async () => `Hello_${counter++}`;

    const result1 = await cacheManager.getCacheResult(
      req,
      cacheControl,
      render,
      ssrContext,
    );
    expect(result1).toEqual(`Hello_0`);

    await sleep(600);
    const result2 = await cacheManager.getCacheResult(
      req,
      cacheControl,
      render,
      ssrContext,
    );
    expect(result2).toEqual(`Hello_1`);

    await sleep(600);
    const result3 = await cacheManager.getCacheResult(
      req,
      cacheControl,
      render,
      ssrContext,
    );
    expect(result3).toEqual(`Hello_2`);
  });
});
