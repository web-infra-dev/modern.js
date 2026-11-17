import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fs } from '@modern-js/utils';
import { Hono } from 'hono';
import {
  type ResolvedCompressOptions,
  createCompressMiddleware,
  getCompressedFileCacheSize,
  negotiateEncoding,
  resolveCompressOptions,
  setCompressedFileCacheLimit,
} from '../../src/adapters/node/plugins/compress';
import { createStaticMiddleware } from '../../src/adapters/node/plugins/static';

const html = `<!doctype html><html><body>${'<p>hello</p>'.repeat(200)}</body></html>`;

const options: ResolvedCompressOptions = {
  threshold: 1024,
  encodings: ['br', 'gzip'],
};

const decompress = (encoding: string | null, data: Buffer) =>
  encoding === 'br' ? zlib.brotliDecompressSync(data) : zlib.gunzipSync(data);

const readBody = async (res: Response) =>
  decompress(
    res.headers.get('content-encoding'),
    Buffer.from(await res.arrayBuffer()),
  ).toString();

describe('negotiateEncoding', () => {
  it('should pick the first encoding in server preference order', () => {
    expect(negotiateEncoding('gzip, deflate, br', ['br', 'gzip'])).toBe('br');
    expect(negotiateEncoding('gzip, deflate', ['br', 'gzip'])).toBe('gzip');
    expect(negotiateEncoding('gzip, br', ['gzip', 'br'])).toBe('gzip');
  });

  it('should respect quality values and wildcards', () => {
    expect(negotiateEncoding('br;q=0, gzip;q=0.5', ['br', 'gzip'])).toBe(
      'gzip',
    );
    expect(negotiateEncoding('*', ['br', 'gzip'])).toBe('br');
    expect(negotiateEncoding('*;q=0, gzip', ['br', 'gzip'])).toBe('gzip');
    expect(negotiateEncoding('identity', ['br', 'gzip'])).toBeUndefined();
    expect(negotiateEncoding(undefined, ['br', 'gzip'])).toBeUndefined();
  });

  it('should allow whitespace around the parameters', () => {
    expect(negotiateEncoding('br ;q=0, *;q=1', ['br', 'gzip'])).toBe('gzip');
    expect(negotiateEncoding('gzip ; q = 0.5', ['br', 'gzip'])).toBe('gzip');
  });
});

describe('resolveCompressOptions', () => {
  afterEach(() => {
    rstest.unstubAllEnvs();
  });

  it('should only enable compression in production', () => {
    rstest.stubEnv('NODE_ENV', 'development');
    expect(resolveCompressOptions(true, true)).toBeUndefined();
    rstest.stubEnv('NODE_ENV', 'production');
    expect(resolveCompressOptions(undefined, true)).toEqual(options);
  });

  it('should respect the default and explicit options', () => {
    rstest.stubEnv('NODE_ENV', 'production');
    expect(resolveCompressOptions(undefined, false)).toBeUndefined();
    expect(resolveCompressOptions(false, true)).toBeUndefined();
    expect(resolveCompressOptions(true, false)).toEqual(options);
    expect(
      resolveCompressOptions({ threshold: 0, encodings: ['gzip'] }, false),
    ).toEqual({ threshold: 0, encodings: ['gzip'] });
  });
});

describe('compress middleware', () => {
  it('should leave responses that are not static files unchanged', async () => {
    const app = new Hono();
    app.use(createCompressMiddleware(options) as any);
    app.get('/page', c => c.html(html, 200, { ETag: '"page"' }));
    app.get('/api', c => c.json({ html }));
    for (const pathname of ['/page', '/api']) {
      const res = await app.request(pathname, {
        headers: { 'Accept-Encoding': 'br, gzip' },
      });
      expect(res.headers.get('content-encoding')).toBeNull();
      expect(res.headers.get('vary')).toBeNull();
    }
    const page = await app.request('/page', {
      headers: { 'Accept-Encoding': 'br' },
    });
    expect(page.headers.get('etag')).toBe('"page"');
    expect(await page.text()).toBe(html);
  });
});

describe('static middleware compression', () => {
  let pwd: string;
  const js = 'console.log("hello");\n'.repeat(200);

  beforeAll(async () => {
    pwd = await fs.mkdtemp(path.join(os.tmpdir(), 'modern-compress-'));
    await fs.outputFile(path.join(pwd, 'static/js/main.js'), js);
    await fs.outputFile(path.join(pwd, 'static/js/cached.js'), js);
    await fs.outputFile(path.join(pwd, 'static/js/head.js'), js);
    await fs.outputFile(path.join(pwd, 'static/js/tiny.js'), 'tiny');
    await fs.outputFile(path.join(pwd, 'static/image/a.png'), 'x'.repeat(4096));
    await fs.outputFile(
      path.join(pwd, 'public/robots.txt'),
      'robots\n'.repeat(400),
    );
  });

  afterAll(async () => {
    await fs.remove(pwd);
  });

  const createApp = (
    compress?: ResolvedCompressOptions,
    before?: (app: Hono) => void,
  ) => {
    const app = new Hono();
    if (compress) {
      app.use(createCompressMiddleware(compress) as any);
    }
    before?.(app);
    app.use(
      createStaticMiddleware({
        pwd,
        routes: [{ urlPath: '/robots.txt', entryPath: 'public/robots.txt' }],
        output: {},
        html: {},
        server: {},
      }) as any,
    );
    return app;
  };

  it.each(['br', 'gzip'])(
    'should serve compressed static files with %s',
    async encoding => {
      const app = createApp(options);
      const res = await app.request('/static/js/main.js', {
        headers: { 'Accept-Encoding': encoding },
      });
      const body = Buffer.from(await res.arrayBuffer());
      expect(res.headers.get('content-encoding')).toBe(encoding);
      expect(res.headers.get('vary')).toBe('Accept-Encoding');
      expect(res.headers.get('content-length')).toBe(String(body.byteLength));
      expect(body.byteLength).toBeLessThan(js.length);
      expect(decompress(encoding, body).toString()).toBe(js);

      const publicRes = await app.request('/robots.txt', {
        headers: { 'Accept-Encoding': encoding },
      });
      expect(publicRes.headers.get('content-encoding')).toBe(encoding);
      expect(await readBody(publicRes)).toBe('robots\n'.repeat(400));
    },
  );

  it('should compress a static file only once', async () => {
    const app = createApp(options);
    const brotli = rstest.spyOn(zlib, 'brotliCompress');
    const request = () =>
      app.request('/static/js/cached.js', {
        headers: { 'Accept-Encoding': 'br' },
      });
    const responses = [...(await Promise.all([request(), request()]))];
    responses.push(await request());
    const bodies = await Promise.all(
      responses.map(async res => Buffer.from(await res.arrayBuffer())),
    );
    expect(brotli).toHaveBeenCalledTimes(1);
    expect(bodies[1]).toEqual(bodies[0]);
    expect(bodies[2]).toEqual(bodies[0]);
    expect(decompress('br', bodies[0]).toString()).toBe(js);
    brotli.mockRestore();
  });

  it('should not compress static files for HEAD requests', async () => {
    const brotli = rstest.spyOn(zlib, 'brotliCompress');
    const res = await createApp(options).request('/static/js/head.js', {
      method: 'HEAD',
      headers: { 'Accept-Encoding': 'br' },
    });
    expect(res.headers.get('content-encoding')).toBeNull();
    expect(res.headers.get('vary')).toBe('Accept-Encoding');
    expect(brotli).not.toHaveBeenCalled();
    brotli.mockRestore();
  });

  it.each([
    ['before', 'before'],
    ['after', 'after'],
  ])(
    'should respect no-transform set by a middleware %s await next()',
    async (_, when) => {
      const app = createApp(options, app =>
        app.use(async (c, next) => {
          if (when === 'before') {
            c.header('Cache-Control', 'no-transform');
          }
          await next();
          if (when === 'after') {
            c.res.headers.set('Cache-Control', 'no-transform');
          }
        }),
      );
      const res = await app.request('/static/js/main.js', {
        headers: { 'Accept-Encoding': 'br' },
      });
      expect(res.headers.get('content-encoding')).toBeNull();
      expect(await res.text()).toBe(js);
    },
  );

  it('should add vary to the uncompressed variant of a static file', async () => {
    const app = createApp(options);
    for (const headers of [{}, { 'Accept-Encoding': 'identity' }]) {
      const res = await app.request('/static/js/main.js', { headers });
      expect(res.headers.get('content-encoding')).toBeNull();
      expect(res.headers.get('vary')).toBe('Accept-Encoding');
      expect(await res.text()).toBe(js);
    }
  });

  it('should add vary to a 304 response for a static file', async () => {
    const app = createApp(options);
    for (const pathname of ['/static/js/main.js', '/robots.txt']) {
      const first = await app.request(pathname, {
        headers: { 'Accept-Encoding': 'br' },
      });
      const res = await app.request(pathname, {
        headers: {
          'Accept-Encoding': 'br',
          'If-None-Match': first.headers.get('etag')!,
        },
      });
      expect(res.status).toBe(304);
      expect(res.headers.get('vary')).toBe('Accept-Encoding');
      expect(res.headers.get('content-encoding')).toBeNull();
    }
    const tiny = await app.request('/static/js/tiny.js');
    const notModified = await app.request('/static/js/tiny.js', {
      headers: { 'If-None-Match': tiny.headers.get('etag')! },
    });
    expect(notModified.status).toBe(304);
    expect(notModified.headers.get('vary')).toBeNull();
  });

  it('should not compress a static file whose body a middleware replaced', async () => {
    const app = createApp(options, app =>
      app.use(async (c, next) => {
        await next();
        c.res = new Response(`${await c.res.text()}// changed`, c.res);
      }),
    );
    const res = await app.request('/static/js/main.js', {
      headers: { 'Accept-Encoding': 'br' },
    });
    expect(res.headers.get('content-encoding')).toBeNull();
    expect(res.headers.get('vary')).toBeNull();
    expect(await res.text()).toBe(`${js}// changed`);
  });

  it('should skip small, binary or uncompressed static files', async () => {
    const headers = { 'Accept-Encoding': 'br, gzip' };
    const app = createApp(options);
    for (const pathname of ['/static/js/tiny.js', '/static/image/a.png']) {
      const res = await app.request(pathname, { headers });
      expect(res.headers.get('content-encoding')).toBeNull();
      expect(res.headers.get('vary')).toBeNull();
    }
    const disabled = await createApp().request('/static/js/main.js', {
      headers,
    });
    expect(disabled.headers.get('content-encoding')).toBeNull();
    expect(disabled.headers.get('vary')).toBeNull();
    expect(await disabled.text()).toBe(js);
  });
});

describe('static compression cache and route headers', () => {
  let pwd: string;
  const js = 'console.log("cached");\n'.repeat(200);

  beforeAll(async () => {
    pwd = await fs.mkdtemp(path.join(os.tmpdir(), 'modern-compress-cache-'));
    for (let i = 0; i < 5; i++) {
      await fs.outputFile(path.join(pwd, `static/js/file${i}.js`), js + i);
    }
    await fs.outputFile(path.join(pwd, 'public/pre.js'), zlib.gzipSync(js));
    await fs.outputFile(path.join(pwd, 'public/cors.js'), js);
  });

  afterAll(async () => {
    setCompressedFileCacheLimit(64 * 1024 * 1024);
    await fs.remove(pwd);
  });

  const createApp = () => {
    const app = new Hono();
    app.use(createCompressMiddleware(options) as any);
    app.use(
      createStaticMiddleware({
        pwd,
        routes: [
          {
            urlPath: '/pre.js',
            entryPath: 'public/pre.js',
            responseHeaders: { 'Content-Encoding': 'gzip' },
          },
          {
            urlPath: '/cors.js',
            entryPath: 'public/cors.js',
            responseHeaders: { Vary: 'Origin' },
          },
          {
            urlPath: '/tagged.js',
            entryPath: 'public/cors.js',
            responseHeaders: { ETag: '"tagged"' },
          },
        ],
        output: {},
        html: {},
        server: {},
      }) as any,
    );
    return app;
  };

  it('should bound the memory used by compressed files', async () => {
    const app = createApp();
    const fileSize = Buffer.byteLength(js) + 1;
    // Room for about two files with their compressed content.
    setCompressedFileCacheLimit(fileSize * 2 + 512);
    for (let i = 0; i < 5; i++) {
      const res = await app.request(`/static/js/file${i}.js`, {
        headers: { 'Accept-Encoding': 'br' },
      });
      expect(
        decompress('br', Buffer.from(await res.arrayBuffer())).toString(),
      ).toBe(js + i);
      expect(getCompressedFileCacheSize()).toBeLessThanOrEqual(
        fileSize * 2 + 512,
      );
    }
  });

  it('should send files a route marks as encoded as they are', async () => {
    const res = await createApp().request('/pre.js', {
      headers: { 'Accept-Encoding': 'br, gzip' },
    });
    expect(res.headers.get('content-encoding')).toBe('gzip');
    expect(
      zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString(),
    ).toBe(js);
  });

  it("should keep the route's Vary header", async () => {
    const res = await createApp().request('/cors.js', {
      headers: { 'Accept-Encoding': 'br' },
    });
    expect(res.headers.get('content-encoding')).toBe('br');
    expect(res.headers.get('vary')).toBe('Origin, Accept-Encoding');
  });

  it("should weaken the route's strong ETag of a compressed file", async () => {
    const app = createApp();
    const compressed = await app.request('/tagged.js', {
      headers: { 'Accept-Encoding': 'br' },
    });
    expect(compressed.headers.get('content-encoding')).toBe('br');
    expect(compressed.headers.get('etag')).toBe('W/"tagged"');
    const identity = await app.request('/tagged.js');
    expect(identity.headers.get('content-encoding')).toBeNull();
    expect(identity.headers.get('etag')).toBe('"tagged"');
  });
});
