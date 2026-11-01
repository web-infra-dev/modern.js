import os from 'node:os';
import path from 'node:path';
import type { ServerRoute } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import { Hono } from 'hono';
import { createStaticMiddleware } from '../../src/adapters/node/plugins/static';
import type { ServerNormalizedConfig } from '../../src/types';

const IMMUTABLE = 'public, max-age=31536000, immutable';

describe('static file cache headers', () => {
  let pwd: string;
  const readFile = rstest.fn();

  beforeAll(async () => {
    pwd = await fs.mkdtemp(path.join(os.tmpdir(), 'modern-static-cache-'));
    await fs.outputFile(path.join(pwd, 'static/js/main.3f2a1b9c0d.js'), 'js');
    await fs.outputFile(path.join(pwd, 'static/css/main.3f2a1b9c.css'), 'css');
    await fs.outputFile(path.join(pwd, 'static/js/plain.js'), 'plain');
    await fs.outputFile(path.join(pwd, 'upload/report.20261101.pdf'), 'report');
    await fs.outputFile(path.join(pwd, 'public/robots.txt'), 'robots');
    await fs.outputFile(path.join(pwd, 'public/custom.txt'), 'custom');
  });

  afterAll(async () => {
    await fs.remove(pwd);
  });

  beforeEach(() => {
    rstest.stubEnv('NODE_ENV', 'production');
    readFile.mockClear();
  });

  afterEach(() => {
    rstest.unstubAllEnvs();
  });

  const routes: ServerRoute[] = [
    { urlPath: '/robots.txt', entryPath: 'public/robots.txt', isSSR: false },
    {
      urlPath: '/custom.txt',
      entryPath: 'public/custom.txt',
      isSSR: false,
      responseHeaders: { 'Cache-Control': 'public, max-age=60' },
    },
  ];

  const createApp = (server: ServerNormalizedConfig = {}) => {
    const app = new Hono();
    app.use(
      createStaticMiddleware({
        pwd,
        routes,
        output: {},
        html: {},
        server,
      }) as any,
    );
    app.all('*', c => c.text('fallback', 404));
    return app;
  };

  it('should cache hashed build assets as immutable', async () => {
    const app = createApp();
    for (const pathname of [
      '/static/js/main.3f2a1b9c0d.js',
      '/static/css/main.3f2a1b9c.css',
    ]) {
      const res = await app.request(pathname);
      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toBe(IMMUTABLE);
    }
  });

  it('should revalidate files without a content hash', async () => {
    const app = createApp();
    for (const pathname of [
      '/static/js/plain.js',
      // A hash-like name outside of the build asset directories.
      '/upload/report.20261101.pdf',
      '/robots.txt',
    ]) {
      const res = await app.request(pathname);
      expect(res.status).toBe(200);
      expect(res.headers.get('cache-control')).toBe('no-cache');
    }
  });

  it('should send validators for every static file', async () => {
    const app = createApp();
    for (const pathname of ['/static/js/main.3f2a1b9c0d.js', '/robots.txt']) {
      const res = await app.request(pathname);
      expect(res.headers.get('etag')).toMatch(/^W\/"[0-9a-f]+-[0-9a-f]+"$/);
      expect(Date.parse(res.headers.get('last-modified') || '')).not.toBeNaN();
    }
  });

  it.each(['/static/js/main.3f2a1b9c0d.js', '/robots.txt'])(
    'should answer conditional requests for %s with 304',
    async pathname => {
      const app = createApp();
      const first = await app.request(pathname);
      const etag = first.headers.get('etag')!;
      const lastModified = first.headers.get('last-modified')!;

      const byEtag = await app.request(pathname, {
        headers: { 'If-None-Match': `"other", ${etag}` },
      });
      expect(byEtag.status).toBe(304);
      expect(await byEtag.text()).toBe('');
      expect(byEtag.headers.get('etag')).toBe(etag);
      expect(byEtag.headers.get('cache-control')).toBe(
        first.headers.get('cache-control'),
      );

      const byDate = await app.request(pathname, {
        headers: { 'If-Modified-Since': lastModified },
      });
      expect(byDate.status).toBe(304);

      const changed = await app.request(pathname, {
        headers: { 'If-None-Match': 'W/"0-0"' },
      });
      expect(changed.status).toBe(200);

      const old = await app.request(pathname, {
        headers: { 'If-Modified-Since': new Date(0).toUTCString() },
      });
      expect(old.status).toBe(200);
    },
  );

  it('should let route response headers override the default', async () => {
    const res = await createApp().request('/custom.txt');
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
  });

  it('should support custom values', async () => {
    const app = createApp({
      staticCacheControl: {
        hashed: 'public, max-age=86400',
        unhashed: 'public, max-age=300',
      },
    });
    expect(
      (await app.request('/static/js/main.3f2a1b9c0d.js')).headers.get(
        'cache-control',
      ),
    ).toBe('public, max-age=86400');
    expect(
      (await app.request('/robots.txt')).headers.get('cache-control'),
    ).toBe('public, max-age=300');
  });

  it('should only send ETag when disabled', async () => {
    const app = createApp({ staticCacheControl: false });
    const res = await app.request('/static/js/main.3f2a1b9c0d.js');
    expect(res.headers.get('cache-control')).toBeNull();
    // Would allow browsers to cache the file heuristically.
    expect(res.headers.get('last-modified')).toBeNull();
    const etag = res.headers.get('etag')!;
    expect(etag).not.toBeNull();

    const revalidated = await app.request('/static/js/main.3f2a1b9c0d.js', {
      headers: { 'If-None-Match': etag },
    });
    expect(revalidated.status).toBe(304);
  });

  it('should revalidate every static file in development', async () => {
    rstest.stubEnv('NODE_ENV', 'development');
    const app = createApp({
      staticCacheControl: { hashed: 'public, max-age=86400' },
    });
    for (const pathname of ['/static/js/main.3f2a1b9c0d.js', '/robots.txt']) {
      const res = await app.request(pathname);
      expect(res.headers.get('cache-control')).toBe('no-cache');
    }
  });
});
