import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServerBase } from '@modern-js/server-core';
import { createLogger } from '@modern-js/utils';
import { applyPlugins } from '../src/apply';
import type { ProdServerOptions } from '../src/types';

let pwd: string;

beforeAll(async () => {
  pwd = await mkdtemp(path.join(tmpdir(), 'modern-server-logger-'));
  await mkdir(path.join(pwd, 'static'));
  await writeFile(path.join(pwd, 'static/app.js'), 'console.log("app")');
});

afterAll(async () => {
  await rm(pwd, { recursive: true, force: true });
});

beforeEach(() => {
  rstest.stubEnv('NODE_ENV', 'production');
  rstest.stubEnv('DEBUG', undefined);
  rstest.stubEnv('MODERN_SERVER_LOG_LEVEL', undefined);
  rstest.spyOn(console, 'log').mockImplementation(() => {});
  rstest.spyOn(console, 'warn').mockImplementation(() => {});
  rstest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  rstest.unstubAllEnvs();
});

async function createServer(
  overrides: Pick<ProdServerOptions, 'logger'> = {},
  enableLogger = true,
) {
  const options: ProdServerOptions = {
    pwd,
    appContext: { apiDirectory: '', lambdaDirectory: '' },
    config: {
      html: {},
      output: {},
      source: {},
      tools: {},
      server: { logger: enableLogger },
      bff: {},
      dev: {},
      security: {},
    },
    routes: [],
    serverConfigPath: '',
    serverConfig: {
      middlewares: [
        {
          name: 'test-page',
          handler: async (c, next) => {
            if (c.req.path === '/messages') {
              const monitors = c.get('monitors');
              monitors.info('application info');
              monitors.warn('application warning');
              monitors.error('application error');
              return c.text('ok');
            }
            if (c.req.path === '/page') {
              return c.html('<h1>Page</h1>');
            }
            await next();
          },
        },
      ],
    },
    ...overrides,
  };
  const server = createServerBase(options);
  await applyPlugins(server, options);
  await server.init();
  return server;
}

async function requestPageAndAsset(
  server: Awaited<ReturnType<typeof createServer>>,
) {
  expect(await (await server.request('/page')).text()).toBe('<h1>Page</h1>');
  expect(await (await server.request('/static/app.js')).text()).toBe(
    'console.log("app")',
  );
}

function stdout() {
  return rstest.mocked(console.log).mock.calls.flat().join(' ');
}

it('omits request logs by default while retaining application info, warnings and errors', async () => {
  const server = await createServer();
  await requestPageAndAsset(server);
  expect(console.log).not.toHaveBeenCalled();

  await server.request('/messages');
  expect(stdout()).toContain('application info');
  expect(stdout()).not.toContain('GET /');
  expect(console.warn).toHaveBeenCalledWith(
    expect.stringContaining('application warning'),
  );
  expect(console.error).toHaveBeenCalledWith(
    expect.stringContaining('application error'),
  );
});

it('allows opting into request logs with verbose', async () => {
  rstest.stubEnv('MODERN_SERVER_LOG_LEVEL', 'verbose');
  const server = await createServer();
  await requestPageAndAsset(server);
  expect(stdout()).toContain('GET /page');
  expect(stdout()).toContain('GET /static/app.js');
});

it('respects the warn level', async () => {
  rstest.stubEnv('MODERN_SERVER_LOG_LEVEL', 'warn');
  const server = await createServer();
  await server.request('/messages');
  expect(console.log).not.toHaveBeenCalled();
  expect(console.warn).toHaveBeenCalled();
  expect(console.error).toHaveBeenCalled();
});

it('respects the silent level', async () => {
  rstest.stubEnv('MODERN_SERVER_LOG_LEVEL', 'silent');
  const server = await createServer();
  await requestPageAndAsset(server);
  await server.request('/messages');
  expect(console.log).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();
});

it.each(['production', 'development'])(
  'preserves verbose logging with DEBUG in %s',
  async nodeEnv => {
    rstest.stubEnv('NODE_ENV', nodeEnv);
    rstest.stubEnv('DEBUG', 'modern-js:*');
    const server = await createServer();
    await requestPageAndAsset(server);
    expect(stdout()).toContain('GET /page');
    expect(stdout()).toContain('GET /static/app.js');
  },
);

it('gives the explicit log level precedence over DEBUG', async () => {
  rstest.stubEnv('DEBUG', 'modern-js:*');
  rstest.stubEnv('MODERN_SERVER_LOG_LEVEL', 'warn');
  const server = await createServer();
  await requestPageAndAsset(server);
  expect(console.log).not.toHaveBeenCalled();
});

it('preserves a custom logger', async () => {
  rstest.stubEnv('MODERN_SERVER_LOG_LEVEL', 'silent');
  const server = await createServer({
    logger: createLogger({ level: 'verbose' }),
  });
  await requestPageAndAsset(server);
  expect(stdout()).toContain('GET /page');
  expect(stdout()).toContain('GET /static/app.js');
});

it('keeps logging disabled when server.logger is false', async () => {
  rstest.stubEnv('MODERN_SERVER_LOG_LEVEL', 'verbose');
  const server = await createServer({}, false);
  await requestPageAndAsset(server);
  await server.request('/messages');
  expect(console.log).not.toHaveBeenCalled();
  expect(console.warn).not.toHaveBeenCalled();
  expect(console.error).not.toHaveBeenCalled();
});
