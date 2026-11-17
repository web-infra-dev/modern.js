import { createServer as createNodeServer } from 'node:http';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createServerBase } from '@modern-js/server-core';
import { applyPlugins } from '../src/apply';
import type { ProdServerOptions } from '../src/types';

const html = `<!doctype html><html><body>${'<p>page</p>'.repeat(200)}</body></html>`;
const js = 'console.log("app");\n'.repeat(200);

let pwd: string;

beforeAll(async () => {
  pwd = await mkdtemp(path.join(tmpdir(), 'modern-server-compress-'));
  await mkdir(path.join(pwd, 'static/js'), { recursive: true });
  await writeFile(path.join(pwd, 'static/js/app.js'), js);
  await mkdir(path.join(pwd, 'public'));
  await writeFile(path.join(pwd, 'public/robots.txt'), 'robots');
});

afterAll(async () => {
  await rm(pwd, { recursive: true, force: true });
});

beforeEach(() => {
  rstest.stubEnv('NODE_ENV', 'production');
});

afterEach(() => {
  rstest.unstubAllEnvs();
});

type CompressConfig = ProdServerOptions['config']['server']['compress'];

async function createServer({
  compress,
  serverCompress,
  nodeServer = true,
}: {
  compress?: CompressConfig;
  /** `server.compress` in `server/modern.server.ts`. */
  serverCompress?: CompressConfig;
  nodeServer?: boolean;
} = {}) {
  const options: ProdServerOptions = {
    pwd,
    appContext: { apiDirectory: '', lambdaDirectory: '' },
    config: {
      html: {},
      output: {},
      source: {},
      tools: {},
      server: { logger: false, compress },
      bff: {},
      dev: {},
      security: {},
    },
    routes: [
      { urlPath: '/robots.txt', entryPath: 'public/robots.txt', isSSR: false },
    ],
    serverConfigPath: '',
    serverConfig: {
      // Only set when given, an explicit `undefined` would override `modern.config.ts`.
      server: serverCompress === undefined ? {} : { compress: serverCompress },
      middlewares: [
        {
          name: 'test-page',
          handler: async (c, next) => {
            if (c.req.path === '/page') {
              return c.html(html);
            }
            if (c.req.path === '/user-compressed') {
              return c.body(zlib.gzipSync(html), 200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Encoding': 'gzip',
              });
            }
            await next();
          },
        },
      ],
    },
  };
  const server = createServerBase(options);
  await applyPlugins(
    server,
    options,
    nodeServer ? createNodeServer() : undefined,
  );
  await server.init();
  return server;
}

const request = (
  server: Awaited<ReturnType<typeof createServer>>,
  pathname: string,
) => server.request(pathname, { headers: { 'Accept-Encoding': 'gzip, br' } });

const decode = async (res: Response) => {
  const body = Buffer.from(await res.arrayBuffer());
  const encoding = res.headers.get('content-encoding');
  if (encoding === 'br') {
    return zlib.brotliDecompressSync(body).toString();
  }
  return encoding === 'gzip'
    ? zlib.gunzipSync(body).toString()
    : body.toString();
};

it('compresses static files with brotli by default', async () => {
  const server = await createServer();

  const asset = await request(server, '/static/js/app.js');
  expect(asset.headers.get('content-encoding')).toBe('br');
  expect(asset.headers.get('vary')).toBe('Accept-Encoding');
  expect(await decode(asset)).toBe(js);

  const identity = await server.request('/static/js/app.js');
  expect(identity.headers.get('content-encoding')).toBeNull();
  expect(identity.headers.get('vary')).toBe('Accept-Encoding');
  expect(await identity.text()).toBe(js);
});

it('does not compress responses that are not static files', async () => {
  const server = await createServer();
  const page = await request(server, '/page');
  expect(page.headers.get('content-encoding')).toBeNull();
  expect(page.headers.get('vary')).toBeNull();
  expect(await page.text()).toBe(html);

  const encoded = await request(server, '/user-compressed');
  expect(encoded.headers.get('content-encoding')).toBe('gzip');
  expect(await decode(encoded)).toBe(html);
});

it('does not compress files below the threshold', async () => {
  const server = await createServer();
  const res = await request(server, '/robots.txt');
  expect(res.headers.get('content-encoding')).toBeNull();
  expect(res.headers.get('content-length')).toBe('6');
  expect(await res.text()).toBe('robots');
});

it('respects the configured encodings', async () => {
  const server = await createServer({ compress: { encodings: ['gzip'] } });
  const asset = await request(server, '/static/js/app.js');
  expect(asset.headers.get('content-encoding')).toBe('gzip');
  expect(await decode(asset)).toBe(js);
});

it('can be disabled with server.compress', async () => {
  const server = await createServer({ compress: false });
  const res = await request(server, '/static/js/app.js');
  expect(res.headers.get('content-encoding')).toBeNull();
  expect(res.headers.get('vary')).toBeNull();
});

it('lets server/modern.server.ts override modern.config.ts', async () => {
  const disabled = await createServer({
    compress: true,
    serverCompress: false,
  });
  const res = await request(disabled, '/static/js/app.js');
  expect(res.headers.get('content-encoding')).toBeNull();

  const lowThreshold = await createServer({
    compress: { threshold: 1024 * 1024 },
    serverCompress: { threshold: 0 },
  });
  const asset = await request(lowThreshold, '/static/js/app.js');
  expect(asset.headers.get('content-encoding')).toBe('br');
});

it('is disabled by default outside of the Node.js server', async () => {
  const server = await createServer({ nodeServer: false });
  const res = await request(server, '/static/js/app.js');
  expect(res.headers.get('content-encoding')).toBeNull();

  const enabled = await createServer({ nodeServer: false, compress: true });
  const compressed = await request(enabled, '/static/js/app.js');
  expect(compressed.headers.get('content-encoding')).toBe('br');
});

it('is disabled in development', async () => {
  rstest.stubEnv('NODE_ENV', 'development');
  const server = await createServer({ compress: true });
  const res = await request(server, '/static/js/app.js');
  expect(res.headers.get('content-encoding')).toBeNull();
  expect(await res.text()).toBe(js);
});
