import type { CacheControl, Container } from '@modern-js/types';
import type { NodeRequest } from '@modern-js/types/server';
import {
  getCacheResult,
  matchCacheControl,
} from '../../src/plugins/render/ssrCache';

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

    const requestHandler = () =>
      Promise.resolve(new Response(`Hello_${counter++}`));

    const result1 = await getCacheResult(req, {
      cacheControl,
      requestHandler,
      requestHandlerOptions: {} as any,
      container,
    });

    const html1 = await result1.text();

    expect(html1).toEqual(`Hello_0`);

    await sleep(50);
    const result2 = await getCacheResult(req, {
      cacheControl,
      requestHandler,
      requestHandlerOptions: {} as any,
      container,
    });

    const html2 = await result2.text();

    expect(html2).toEqual(`Hello_0`);

    await sleep(100);
    const result3 = await getCacheResult(req, {
      cacheControl,
      requestHandler,
      requestHandlerOptions: {} as any,
      container,
    });

    const html3 = await result3.text();

    expect(html3).toEqual(`Hello_0`);

    expect(html3).toEqual(`Hello_0`);
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
    const requestHandler = () =>
      Promise.resolve(new Response(`Hello_${counter++}`));

    const result1 = await getCacheResult(req, {
      cacheControl,
      requestHandler,
      requestHandlerOptions: {} as any,
      container,
    });

    const html1 = await result1.text();

    expect(html1).toEqual(`Hello_0`);

    await sleep(150);
    const result2 = await getCacheResult(req, {
      cacheControl,
      requestHandler,
      requestHandlerOptions: {} as any,
      container,
    });

    const html2 = await result2.text();

    expect(html2).toEqual(`Hello_0`);

    await sleep(50);
    const result3 = await getCacheResult(req, {
      cacheControl,
      requestHandler,
      requestHandlerOptions: {} as any,
      container,
    });
    const html3 = await result3.text();

    expect(html3).toEqual(`Hello_1`);
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

    const requestHandler = () =>
      Promise.resolve(new Response(`Hello_${counter++}`));

    const result1 = await getCacheResult(req, {
      cacheControl,
      requestHandler,
      requestHandlerOptions: {} as any,
      container,
    });

    const html1 = await result1.text();

    expect(html1).toEqual(`Hello_0`);

    await sleep(600);
    const result2 = await getCacheResult(req, {
      cacheControl,
      requestHandler,
      requestHandlerOptions: {} as any,
      container,
    });

    const html2 = await result2.text();

    expect(html2).toEqual(`Hello_1`);

    await sleep(600);
    const result3 = await getCacheResult(req, {
      cacheControl,
      requestHandler,
      requestHandlerOptions: {} as any,
      container,
    });

    const html3 = await result3.text();

    expect(html3).toEqual(`Hello_2`);
  });
});

describe('matchCacheControl', () => {
  const createReq = (url: string) =>
    ({ url, headers: {} }) as unknown as NodeRequest;
  const user: CacheControl = { maxAge: 1, staleWhileRevalidate: 1 };
  const blog: CacheControl = { maxAge: 2, staleWhileRevalidate: 2 };
  const other: CacheControl = { maxAge: 3, staleWhileRevalidate: 3 };

  it('returns the option of the first matched pattern', () => {
    const getBlog = rstest.fn(() => blog);
    const options = {
      '^/user/\\d+$': user,
      '^/blog': getBlog,
      '*': other,
    };

    // Run twice to also match with compiled patterns.
    for (let i = 0; i < 2; i++) {
      expect(matchCacheControl(options, createReq('/user/42'))).toBe(user);
      const blogReq = createReq('/blog/post');
      expect(matchCacheControl(options, blogReq)).toBe(blog);
      expect(getBlog).toHaveBeenLastCalledWith(blogReq);
      expect(matchCacheControl(options, createReq('/user/me'))).toBe(other);
    }
    expect(
      matchCacheControl({ '^/user/\\d+$': user }, createReq('/user/me')),
    ).toBeUndefined();
  });

  it('throws for an invalid pattern on every request', () => {
    for (let i = 0; i < 2; i++) {
      expect(() =>
        matchCacheControl({ '/user/(': user }, createReq('/user/1')),
      ).toThrow(SyntaxError);
    }
  });

  it('compiles each pattern only once', () => {
    const compiled: string[] = [];
    const OriginalRegExp = globalThis.RegExp;
    globalThis.RegExp = new Proxy(OriginalRegExp, {
      construct(target, args) {
        compiled.push(String(args[0]));
        return Reflect.construct(target, args);
      },
    });
    try {
      const options = { '^/compile-once/a': user, '^/compile-once/b': blog };
      for (let i = 0; i < 3; i++) {
        expect(matchCacheControl(options, createReq('/compile-once/b'))).toBe(
          blog,
        );
      }
    } finally {
      globalThis.RegExp = OriginalRegExp;
    }

    expect(compiled.filter(source => source.includes('compile-once'))).toEqual([
      '^/compile-once/a',
      '^/compile-once/b',
    ]);
  });
});
