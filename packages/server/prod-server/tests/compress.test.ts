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

it('compresses pages and static assets with brotli by default', async () => {
  const server = await createServer();

  const page = await request(server, '/page');
  expect(page.headers.get('content-encoding')).toBe('br');
  expect(page.headers.get('vary')).toBe('Accept-Encoding');
  expect(
    zlib.brotliDecompressSync(Buffer.from(await page.arrayBuffer())).toString(),
  ).toBe(html);

  const asset = await request(server, '/static/js/app.js');
  expect(asset.headers.get('content-encoding')).toBe('br');
  expect(
    zlib
      .brotliDecompressSync(Buffer.from(await asset.arrayBuffer()))
      .toString(),
  ).toBe(js);
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
  const page = await request(server, '/page');
  expect(page.headers.get('content-encoding')).toBe('gzip');
  expect(
    zlib.gunzipSync(Buffer.from(await page.arrayBuffer())).toString(),
  ).toBe(html);
});

it('does not compress responses already encoded by a user middleware', async () => {
  const server = await createServer();
  const res = await request(server, '/user-compressed');
  expect(res.headers.get('content-encoding')).toBe('gzip');
  expect(zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString()).toBe(
    html,
  );
});

it('can be disabled with server.compress', async () => {
  const server = await createServer({ compress: false });
  for (const pathname of ['/page', '/static/js/app.js']) {
    const res = await request(server, pathname);
    expect(res.headers.get('content-encoding')).toBeNull();
    expect(res.headers.get('vary')).toBeNull();
  }
});

it('lets server/modern.server.ts override modern.config.ts', async () => {
  const disabled = await createServer({
    compress: true,
    serverCompress: false,
  });
  const res = await request(disabled, '/page');
  expect(res.headers.get('content-encoding')).toBeNull();

  const lowThreshold = await createServer({
    compress: { threshold: 1024 * 1024 },
    serverCompress: { threshold: 0 },
  });
  const page = await request(lowThreshold, '/page');
  expect(page.headers.get('content-encoding')).toBe('br');
});

it('is disabled by default outside of the Node.js server', async () => {
  const server = await createServer({ nodeServer: false });
  const res = await request(server, '/page');
  expect(res.headers.get('content-encoding')).toBeNull();

  const enabled = await createServer({ nodeServer: false, compress: true });
  const compressed = await request(enabled, '/page');
  expect(compressed.headers.get('content-encoding')).toBe('br');
});

it('is disabled in development', async () => {
  rstest.stubEnv('NODE_ENV', 'development');
  const server = await createServer({ compress: true });
  const res = await request(server, '/page');
  expect(res.headers.get('content-encoding')).toBeNull();
  expect(await res.text()).toBe(html);
});
