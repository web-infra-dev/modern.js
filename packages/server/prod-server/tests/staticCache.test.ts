import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServerBase } from '@modern-js/server-core';
import { applyPlugins } from '../src/apply';
import type { ProdServerOptions } from '../src/types';

let pwd: string;

beforeAll(async () => {
  pwd = await mkdtemp(path.join(tmpdir(), 'modern-server-static-cache-'));
  await mkdir(path.join(pwd, 'static/js'), { recursive: true });
  await writeFile(path.join(pwd, 'static/js/main.3f2a1b9c0d.js'), 'main');
  await writeFile(path.join(pwd, 'static/js/override.3f2a1b9c0d.js'), 'o');
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

async function createServer(
  staticCacheControl?: ProdServerOptions['config']['server']['staticCacheControl'],
) {
  const options: ProdServerOptions = {
    pwd,
    appContext: { apiDirectory: '', lambdaDirectory: '' },
    config: {
      html: {},
      output: {},
      source: {},
      tools: {},
      server: { logger: false, staticCacheControl },
      bff: {},
      dev: {},
      security: {},
    },
    routes: [],
    serverConfigPath: '',
    serverConfig: {
      middlewares: [
        {
          name: 'custom-cache-control',
          handler: async (c, next) => {
            await next();
            if (c.req.path.includes('override')) {
              c.res.headers.set('Cache-Control', 'public, max-age=60');
            }
          },
        },
      ],
    },
  };
  const server = createServerBase(options);
  await applyPlugins(server, options);
  await server.init();
  return server;
}

it('caches hashed build assets as immutable and answers revalidation with 304', async () => {
  const server = await createServer();
  const res = await server.request('/static/js/main.3f2a1b9c0d.js');
  expect(res.status).toBe(200);
  expect(res.headers.get('cache-control')).toBe(
    'public, max-age=31536000, immutable',
  );

  const revalidated = await server.request('/static/js/main.3f2a1b9c0d.js', {
    headers: { 'If-None-Match': res.headers.get('etag')! },
  });
  expect(revalidated.status).toBe(304);
});

it('keeps Cache-Control set by a custom middleware', async () => {
  const server = await createServer();
  const res = await server.request('/static/js/override.3f2a1b9c0d.js');
  expect(res.headers.get('cache-control')).toBe('public, max-age=60');
});

it('can be disabled with server.staticCacheControl', async () => {
  const server = await createServer(false);
  const res = await server.request('/static/js/main.3f2a1b9c0d.js');
  expect(res.headers.get('cache-control')).toBeNull();
});
