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
  const createApp = (setup: (app: Hono) => void) => {
    const app = new Hono();
    app.use(createCompressMiddleware(options) as any);
    setup(app);
    return app;
  };

  it.each(['br', 'gzip'])('should compress with %s', async encoding => {
    const app = createApp(app => app.get('/', c => c.html(html)));
    const res = await app.request('/', {
      headers: { 'Accept-Encoding': encoding },
    });
    expect(res.headers.get('content-encoding')).toBe(encoding);
    expect(res.headers.get('content-length')).toBeNull();
    expect(res.headers.get('vary')).toBe('Accept-Encoding');
    expect(await readBody(res)).toBe(html);
  });

  it('should add vary but not compress when no encoding is accepted', async () => {
    const app = createApp(app => app.get('/', c => c.html(html)));
    const res = await app.request('/');
    expect(res.headers.get('content-encoding')).toBeNull();
    expect(res.headers.get('vary')).toBe('Accept-Encoding');
    expect(await res.text()).toBe(html);
  });

  it('should skip responses that should not be compressed', async () => {
    const app = createApp(app => {
      app.get('/small', c => {
        c.header('Content-Length', '5');
        return c.text('small');
      });
      app.get('/image', c => {
        c.header('Content-Type', 'image/png');
        return c.body(new Uint8Array(4096));
      });
      app.get('/encoded', c => {
        c.header('Content-Encoding', 'gzip');
        return c.body(zlib.gzipSync(html), 200, {
          'Content-Type': 'text/html',
        });
      });
      app.get('/no-transform', c => {
        c.header('Cache-Control', 'public, no-transform');
        return c.html(html);
      });
      app.get('/sse', c => {
        c.header('Content-Type', 'text/event-stream');
        return c.body('data: hello\n\n'.repeat(200));
      });
      app.get('/empty', c => c.body(null, 204));
    });
    const headers = { 'Accept-Encoding': 'br, gzip' };
    for (const pathname of ['/small', '/image', '/no-transform', '/sse']) {
      const res = await app.request(pathname, { headers });
      expect(res.headers.get('content-encoding')).toBeNull();
    }
    const encoded = await app.request('/encoded', { headers });
    expect(encoded.headers.get('content-encoding')).toBe('gzip');
    expect(await readBody(encoded)).toBe(html);
    const empty = await app.request('/empty', { headers });
    expect(empty.status).toBe(204);
    expect(empty.headers.get('content-encoding')).toBeNull();
    const head = await app.request('/no-transform', {
      method: 'HEAD',
      headers,
    });
    expect(head.headers.get('content-encoding')).toBeNull();
  });

  it.each(['br', 'gzip'])(
    'should flush every chunk of a streaming response with %s',
    async encoding => {
      let sendRest!: () => void;
      const rest = new Promise<void>(resolve => {
        sendRest = resolve;
      });
      const app = createApp(app =>
        app.get('/', c => {
          const encoder = new TextEncoder();
          const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
              controller.enqueue(encoder.encode('<html><body>shell'));
              await rest;
              controller.enqueue(encoder.encode('content</body></html>'));
              controller.close();
            },
          });
          return c.body(stream, 200, {
            'Content-Type': 'text/html; charset=utf-8',
          });
        }),
      );
      const res = await app.request('/', {
        headers: { 'Accept-Encoding': encoding },
      });
      expect(res.headers.get('content-encoding')).toBe(encoding);

      // The shell must be decodable before the rest of the stream is sent.
      const reader = res.body!.getReader();
      const { value } = await reader.read();
      const partial =
        encoding === 'br'
          ? zlib.brotliDecompressSync(value!, {
              finishFlush: zlib.constants.BROTLI_OPERATION_FLUSH,
            })
          : zlib.gunzipSync(value!, {
              finishFlush: zlib.constants.Z_SYNC_FLUSH,
            });
      expect(partial.toString()).toBe('<html><body>shell');

      sendRest();
      const chunks = [Buffer.from(value!)];
      for (;;) {
        const result = await reader.read();
        if (result.done) {
          break;
        }
        chunks.push(Buffer.from(result.value));
      }
      expect(decompress(encoding, Buffer.concat(chunks)).toString()).toBe(
        '<html><body>shellcontent</body></html>',
      );
    },
  );
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

  it('should skip small, binary or uncompressed static files', async () => {
    const headers = { 'Accept-Encoding': 'br, gzip' };
    const app = createApp(options);
    for (const pathname of ['/static/js/tiny.js', '/static/image/a.png']) {
      const res = await app.request(pathname, { headers });
      expect(res.headers.get('content-encoding')).toBeNull();
    }
    const disabled = await createApp().request('/static/js/main.js', {
      headers,
    });
    expect(disabled.headers.get('content-encoding')).toBeNull();
    expect(disabled.headers.get('vary')).toBeNull();
    expect(await disabled.text()).toBe(js);
  });
});

describe('compress middleware edge cases', () => {
  const createApp = (setup: (app: Hono) => void) => {
    const app = new Hono();
    app.use(createCompressMiddleware(options) as any);
    setup(app);
    return app;
  };

  it('should not compress small responses without Content-Length', async () => {
    const app = createApp(app => app.get('/', c => c.json({ ok: true })));
    for (const headers of [{ 'Accept-Encoding': 'br' }, {}]) {
      const res = await app.request('/', { headers });
      expect(res.headers.get('content-encoding')).toBeNull();
      expect(res.headers.get('vary')).toBeNull();
      expect(res.headers.get('content-length')).toBe('11');
      expect(await res.json()).toEqual({ ok: true });
    }
  });

  it('should keep the body when the client accepts no encoding', async () => {
    const app = createApp(app => app.get('/', c => c.html(html)));
    const res = await app.request('/', {
      headers: { 'Accept-Encoding': 'identity' },
    });
    expect(res.headers.get('content-encoding')).toBeNull();
    expect(await res.text()).toBe(html);
  });

  it.each(['br', 'gzip'])(
    'should not throw when the response is cancelled while compressing with %s',
    async encoding => {
      const errors: unknown[] = [];
      const onError = (error: unknown) => errors.push(error);
      process.on('uncaughtException', onError);
      process.on('unhandledRejection', onError);
      const chunk = new Uint8Array(1024 * 1024).map((_, i) => (i * 7919) % 251);
      const app = createApp(app =>
        app.get('/', c =>
          c.body(
            new ReadableStream<Uint8Array>({
              pull(controller) {
                controller.enqueue(chunk);
              },
            }),
            200,
            { 'Content-Type': 'text/html' },
          ),
        ),
      );
      try {
        for (let i = 0; i < 10; i++) {
          const res = await app.request('/', {
            headers: { 'Accept-Encoding': encoding },
          });
          const reader = res.body!.getReader();
          await reader.read();
          reader.read().catch(() => {});
          await new Promise(resolve => setImmediate(resolve));
          await reader.cancel(new Error('client gone')).catch(() => {});
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      } finally {
        process.off('uncaughtException', onError);
        process.off('unhandledRejection', onError);
      }
      expect(errors).toEqual([]);
    },
  );

  it('should release zlib when a response is cancelled between chunks', async () => {
    const createGzip = zlib.createGzip;
    const streams: zlib.Gzip[] = [];
    const spy = rstest.spyOn(zlib, 'createGzip').mockImplementation(opts => {
      const zstream = createGzip(opts);
      streams.push(zstream);
      return zstream;
    });
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const app = new Hono();
    app.use(createCompressMiddleware(options) as any);
    app.get('/', c =>
      c.body(
        new ReadableStream<Uint8Array>({
          async start(controller) {
            controller.enqueue(new TextEncoder().encode(html));
            await gate;
            controller.close();
          },
        }),
        200,
        { 'Content-Type': 'text/html' },
      ),
    );
    try {
      const res = await app.request('/', {
        headers: { 'Accept-Encoding': 'gzip' },
      });
      const reader = res.body!.getReader();
      await reader.read();
      await reader.cancel(new Error('client gone'));
      expect(streams).toHaveLength(1);
      expect(streams[0].destroyed).toBe(true);
    } finally {
      release();
      spy.mockRestore();
    }
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
});
