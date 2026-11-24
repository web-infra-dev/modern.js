import type { Monitors } from '@modern-js/types';
import {
  type CacheConfig,
  type RequestHandler,
  createServerBase,
  getRenderHandler,
} from '../src';

export function getDefaultConfig() {
  return {
    html: {},
    output: {},
    source: {},
    tools: {},
    server: {},
    bff: {},
    dev: {},
    security: {},
  };
}

export function getDefaultAppContext() {
  return {
    apiDirectory: '',
    lambdaDirectory: '',
  };
}

export function createDefaultServer() {
  const server = createServerBase({
    config: getDefaultConfig(),
    appContext: getDefaultAppContext(),
    pwd: '',
  });

  return server;
}

// Exercise SSR caching through the public renderer and a user-provided bundle.
export async function createCachedRender(
  cacheConfig: CacheConfig,
  requestHandler: RequestHandler,
) {
  const monitors = {
    push: rstest.fn(),
    error: rstest.fn(),
    warn: rstest.fn(),
    debug: rstest.fn(),
    info: rstest.fn(),
    trace: rstest.fn(),
    timing: rstest.fn(),
    counter: rstest.fn(),
  } satisfies Monitors;
  const render = await getRenderHandler({
    pwd: '',
    routes: [
      { urlPath: '/', entryName: 'main', entryPath: 'index.html', isSSR: true },
    ],
    config: { server: { ssr: true } },
    cacheConfig,
  });

  return {
    monitors,
    render: (request: Request) =>
      render(request, {
        templates: { 'main-/': '<html><head></head><body>CSR</body></html>' },
        serverManifest: {
          renderBundles: {
            main: { requestHandler: Promise.resolve(requestHandler) },
          },
        },
        monitors,
      }),
  };
}
