import os from 'node:os';
import path from 'node:path';
import { fileReader } from '@modern-js/runtime-utils/fileReader';
import type { ServerRoute } from '@modern-js/types';
import { fs } from '@modern-js/utils';
import { Hono } from 'hono';
import { createStaticMiddleware } from '../../src/adapters/node/plugins/static';
import type { ServerNormalizedConfig } from '../../src/types';

const IMMUTABLE = 'public, max-age=31536000, immutable';

describe('static file cache headers', () => {
  let pwd: string;

  beforeAll(async () => {
    pwd = await fs.mkdtemp(path.join(os.tmpdir(), 'modern-static-cache-'));
    await fs.outputFile(path.join(pwd, 'static/js/main.3f2a1b9c0d.js'), 'js');
    await fs.outputFile(path.join(pwd, 'static/css/main.3f2a1b9c.css'), 'css');
    await fs.outputFile(path.join(pwd, 'static/js/plain.js'), 'plain');
    await fs.outputFile(path.join(pwd, 'upload/report.20261101.pdf'), 'report');
    await fs.outputFile(path.join(pwd, 'public/robots.txt'), 'robots');
    await fs.outputFile(path.join(pwd, 'public/custom.txt'), 'custom');
    await fs.outputFile(path.join(pwd, 'public/tagged.txt'), 'tagged');
    await fs.outputFile(path.join(pwd, 'public/comma.txt'), 'comma');
    await fs.outputFile(path.join(pwd, 'public/report.20261101.pdf'), 'pdf');
    await fs.outputFile(
      path.join(pwd, 'static/locales/messages.20261101.json'),
      '{}',
    );
    await fs.outputFile(path.join(pwd, 'root.3f2a1b9c.js'), 'root');
  });

  afterAll(async () => {
    await fs.remove(pwd);
  });

  beforeEach(() => {
    rstest.stubEnv('NODE_ENV', 'production');
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
    { urlPath: '/memory.txt', entryPath: 'public/memory.txt', isSSR: false },
    {
      urlPath: '/tagged.txt',
      entryPath: 'public/tagged.txt',
      isSSR: false,
      responseHeaders: { ETag: '"custom-tag"' },
    },
    {
      urlPath: '/comma.txt',
      entryPath: 'public/comma.txt',
      isSSR: false,
      responseHeaders: { ETag: '"version,1"' },
    },
  ];

  const createApp = (
    server: ServerNormalizedConfig = {},
    output: Record<string, unknown> = {},
    before?: (app: Hono) => void,
  ) => {
    const app = new Hono();
    before?.(app);
    app.use(
      createStaticMiddleware({
        pwd,
        routes,
        output,
        html: {},
        server,
      }) as any,
    );
    app.all('*', c => c.text('fallback', 404));
    return app;
  };

  it('should keep a Cache-Control set before the static middleware', async () => {
    const app = createApp({}, {}, app =>
      app.use(async (c, next) => {
        c.header('Cache-Control', 'private, no-store');
        await next();
      }),
    );
    const res = await app.request('/static/js/main.3f2a1b9c0d.js');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it("should revalidate with a public route's own ETag", async () => {
    const app = createApp();
    const res = await app.request('/tagged.txt');
    expect(res.headers.get('etag')).toBe('"custom-tag"');
    const matched = await app.request('/tagged.txt', {
      headers: { 'If-None-Match': '"custom-tag"' },
    });
    expect(matched.status).toBe(304);
  });

  it('should match an ETag that contains a comma', async () => {
    const app = createApp();
    const matched = await app.request('/comma.txt', {
      headers: { 'If-None-Match': '"other", "version,1"' },
    });
    expect(matched.status).toBe(304);
    const changed = await app.request('/comma.txt', {
      headers: { 'If-None-Match': '"version"' },
    });
    expect(changed.status).toBe(200);
  });

  it('should treat hashed files in a root output directory as build assets', async () => {
    const app = createApp({}, { distPath: { js: '.' } });
    expect(
      (await app.request('/root.3f2a1b9c.js')).headers.get('cache-control'),
    ).toBe(IMMUTABLE);
    expect(
      (await app.request('/upload/report.20261101.pdf')).headers.get(
        'cache-control',
      ),
    ).toBe('no-cache');
    expect(
      (await app.request('/public/report.20261101.pdf')).headers.get(
        'cache-control',
      ),
    ).toBe('no-cache');
  });

  it('should revalidate hashed files in a public directory inside a build asset directory', async () => {
    const app = createApp(
      { publicDir: 'static/locales' },
      { distPath: { js: '.' } },
    );
    expect(
      (await app.request('/static/locales/messages.20261101.json')).headers.get(
        'cache-control',
      ),
    ).toBe('no-cache');
    expect(
      (await app.request('/static/js/main.3f2a1b9c0d.js')).headers.get(
        'cache-control',
      ),
    ).toBe(IMMUTABLE);
  });

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

  it('should derive the ETag from the content that is sent', async () => {
    const app = createApp();
    const etagOf = async (pathname: string) =>
      (await app.request(pathname)).headers.get('etag');
    const etag = await etagOf('/static/js/main.3f2a1b9c0d.js');
    expect(etag).toMatch(/^W\/"[0-9a-f]+-[\w-]{22}"$/);
    expect(await etagOf('/static/js/main.3f2a1b9c0d.js')).toBe(etag);
    expect(await etagOf('/static/js/plain.js')).not.toBe(etag);
    // No `Last-Modified`, it would come from file stats rather than the body.
    expect(
      (await app.request('/robots.txt')).headers.get('last-modified'),
    ).toBeNull();
  });

  it.each(['/static/js/main.3f2a1b9c0d.js', '/robots.txt'])(
    'should answer conditional requests for %s with 304',
    async pathname => {
      const app = createApp();
      const first = await app.request(pathname);
      const etag = first.headers.get('etag')!;

      const matched = await app.request(pathname, {
        headers: { 'If-None-Match': `"other", ${etag}` },
      });
      expect(matched.status).toBe(304);
      expect(await matched.text()).toBe('');
      expect(matched.headers.get('etag')).toBe(etag);
      expect(matched.headers.get('cache-control')).toBe(
        first.headers.get('cache-control'),
      );

      const changed = await app.request(pathname, {
        headers: { 'If-None-Match': 'W/"0-0"' },
      });
      expect(changed.status).toBe(200);
    },
  );

  it('should serve public files that only exist in the in-memory filesystem', async () => {
    // e.g. `dev.writeToDisk: false`, where `fileReader` reads from the
    // compiler's filesystem and the file is not on disk.
    const content = Buffer.from('in memory');
    const memoryFs = {
      stat: (_: string, callback: (err: Error | null, stats?: any) => void) =>
        callback(null, { isFile: () => true }),
      promises: { readFile: async () => content },
    };
    await fileReader.reset(memoryFs as any);
    try {
      const app = createApp();
      const res = await app.request('/memory.txt');
      expect(res.status).toBe(200);
      expect(await res.text()).toBe('in memory');
      const etag = res.headers.get('etag')!;
      const revalidated = await app.request('/memory.txt', {
        headers: { 'If-None-Match': etag },
      });
      expect(revalidated.status).toBe(304);
    } finally {
      await fileReader.reset(fs as any);
    }
  });

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
