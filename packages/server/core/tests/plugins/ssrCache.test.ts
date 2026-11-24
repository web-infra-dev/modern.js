import type { CacheControl, Container } from '@modern-js/types';
import { createCachedRender } from '../helpers';

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

let elapsed = 0;
beforeEach(() => {
  elapsed = 0;
  const now = Date.now.bind(Date);
  rstest.spyOn(Date, 'now').mockImplementation(() => now() + elapsed);
});

afterEach(() => {
  rstest.restoreAllMocks();
});

const strategy: CacheControl = {
  maxAge: 30_000,
  staleWhileRevalidate: 300_000,
};

describe('public SSR cache', () => {
  it('returns cached HTML without rendering again', async () => {
    const container = new MyContainer();
    let counter = 0;
    const { render } = await createCachedRender(
      { strategy, container },
      async () => new Response(`Hello_${counter++}`),
    );
    const req = new Request('http://localhost/a');

    const first = await render(req);
    expect(first.headers.get('x-render-cache')).toBe('miss');
    expect(await first.text()).toBe('Hello_0');
    await expect.poll(() => container.has('/a')).toBe(true);

    for (let i = 0; i < 2; i++) {
      const cached = await render(req);
      expect(cached.headers.get('x-render-cache')).toBe('hit');
      expect(await cached.text()).toBe('Hello_0');
    }
    expect(counter).toBe(1);
  });

  it('serves stale HTML while revalidating the cache', async () => {
    const container = new MyContainer();
    let counter = 0;
    const { render } = await createCachedRender(
      { strategy, container },
      async () => new Response(`Hello_${counter++}`),
    );
    const req = new Request('http://localhost/b');
    expect(await (await render(req)).text()).toBe('Hello_0');
    await expect.poll(() => container.has('/b')).toBe(true);
    const previous = await container.get('/b');

    elapsed += 60_000;
    const stale = await render(req);
    expect(stale.headers.get('x-render-cache')).toBe('stale');
    expect(await stale.text()).toBe('Hello_0');
    await expect.poll(() => container.get('/b')).not.toBe(previous);

    const fresh = await render(req);
    expect(fresh.headers.get('x-render-cache')).toBe('hit');
    expect(await fresh.text()).toBe('Hello_1');
    expect(counter).toBe(2);
  });

  it('renders again after the cache expires', async () => {
    const container = new MyContainer();
    let counter = 0;
    const { render } = await createCachedRender(
      { strategy, container },
      async () => new Response(`Hello_${counter++}`),
    );
    const req = new Request('http://localhost/c');

    for (let i = 0; i < 3; i++) {
      const previous = await container.get('/c');
      const response = await render(req);
      expect(response.headers.get('x-render-cache')).toBe(
        i === 0 ? 'miss' : 'expired',
      );
      expect(await response.text()).toBe(`Hello_${i}`);
      await expect.poll(() => container.get('/c')).not.toBe(previous);
      elapsed += 400_000;
    }
    expect(counter).toBe(3);
  });
});

describe('public SSR cache strategy matching', () => {
  it('uses the first matching pattern, providers and wildcard fallback', async () => {
    const container = new MyContainer();
    const user = { ...strategy, customKey: 'user' };
    const blog = { ...strategy, customKey: 'blog' };
    const other = { ...strategy, customKey: 'other' };
    const getBlog = rstest.fn(() => blog);
    const { render } = await createCachedRender(
      {
        strategy: { '^/user/\\d+$': user, '^/blog': getBlog, '*': other },
        container,
      },
      async req => new Response(new URL(req.url).pathname),
    );

    // Repeated requests also exercise previously compiled patterns.
    for (const cacheStatus of ['miss', 'hit']) {
      for (const [pathname, key] of [
        ['/user/42', 'user'],
        ['/blog/post', 'blog'],
        ['/user/me', 'other'],
      ]) {
        const response = await render(
          new Request(`http://localhost${pathname}`, {
            headers: { 'x-custom': 'strategy' },
          }),
        );
        expect(response.headers.get('x-render-cache')).toBe(cacheStatus);
        expect(await response.text()).toBe(pathname);
        await expect.poll(() => container.has(key)).toBe(true);
      }
    }
    expect(getBlog).toHaveBeenCalledTimes(2);
    expect(getBlog).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: '/blog/post',
        method: 'GET',
        headers: expect.objectContaining({ 'x-custom': 'strategy' }),
      }),
    );
  });

  it('does not cache a request when no pattern matches', async () => {
    const container = new MyContainer();
    let counter = 0;
    const { render } = await createCachedRender(
      { strategy: { '^/user/\\d+$': strategy }, container },
      async () => new Response(`Hello_${counter++}`),
    );
    for (let i = 0; i < 2; i++) {
      const response = await render(new Request('http://localhost/user/me'));
      expect(response.headers.get('x-render-cache')).toBeNull();
      expect(await response.text()).toBe(`Hello_${i}`);
    }
    expect(container.cache.size).toBe(0);
  });

  it('reports an invalid pattern and falls back to CSR on every request', async () => {
    const requestHandler = rstest.fn(async () => new Response('SSR'));
    const { render, monitors } = await createCachedRender(
      { strategy: { '/user/(': strategy }, container: new MyContainer() },
      requestHandler,
    );
    for (let i = 0; i < 2; i++) {
      const response = await render(new Request('http://localhost/user/1'));
      expect(response.headers.get('x-modern-ssr-fallback')).toBe(
        '1;reason=error',
      );
      expect(response.headers.get('x-modernjs-render')).toBe('client');
      expect(await response.text()).toContain('<body>CSR</body>');
    }
    expect(monitors.error).toHaveBeenCalledTimes(2);
    expect(monitors.error).toHaveBeenCalledWith(
      expect.stringContaining('SSR Error'),
      expect.stringContaining('SyntaxError'),
      '/user/1',
      {},
    );
    expect(requestHandler).not.toHaveBeenCalled();
  });
});
