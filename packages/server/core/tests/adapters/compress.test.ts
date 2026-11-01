import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fs } from '@modern-js/utils';
import { Hono } from 'hono';
import {
  type ResolvedCompressOptions,
  createCompressMiddleware,
  negotiateEncoding,
  resolveCompressOptions,
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

  const createApp = (compress?: ResolvedCompressOptions) => {
    const app = new Hono();
    app.use(
      createStaticMiddleware({
        pwd,
        routes: [{ urlPath: '/robots.txt', entryPath: 'public/robots.txt' }],
        output: {},
        html: {},
        server: {},
        compress,
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
