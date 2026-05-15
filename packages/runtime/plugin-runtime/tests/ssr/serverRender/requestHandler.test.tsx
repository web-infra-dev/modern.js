import React from 'react';
import {
  setGlobalContext,
  setGlobalInternalRuntimeContext,
} from '../../../src/core/context';
import { SSRErrors } from '../../../src/core/server/tracer';

describe('createRequestHandler router snapshot fallback', () => {
  it('should honor loader status and errors from routerServerSnapshot when routerContext is absent', async () => {
    const onErrorCalls: unknown[][] = [];
    const onError = (...args: unknown[]) => {
      onErrorCalls.push(args);
    };
    (
      globalThis as typeof globalThis & {
        __webpack_require__?: { u: (chunkId: unknown) => string };
      }
    ).__webpack_require__ = {
      u: chunkId => String(chunkId),
    };

    setGlobalContext({
      entryName: 'main',
      App: () => React.createElement('div', null, 'app'),
      enableRsc: false,
    });
    setGlobalInternalRuntimeContext({
      hooks: {
        wrapRoot: {
          call: (App: React.ComponentType) => App,
        },
        onBeforeRender: {
          call: async (context: any) => {
            context.routerServerSnapshot = {
              statusCode: 418,
              errors: {
                root: new Error('loader failed'),
              },
            };
          },
        },
      },
    } as any);

    const { createRequestHandler } = await import(
      '../../../src/core/server/requestHandler'
    );
    const requestHandler = await createRequestHandler(async () => {
      return new Response('ok', { status: 200 });
    });

    const response = await requestHandler(new Request('http://localhost/'), {
      resource: {
        entryName: 'main',
        route: {
          urlPath: '/',
        },
        htmlTemplate: '<html><head></head><body></body></html>',
      } as any,
      config: {
        ssr: true,
      } as any,
      params: {},
      reporter: undefined,
      monitors: undefined,
      locals: {},
      loaderContext: {},
      onTiming: () => {},
      onError,
    } as any);

    expect(response.status).toBe(418);
    expect(onErrorCalls).toHaveLength(1);
    expect(onErrorCalls[0]?.[1]).toBe(SSRErrors.LOADER_ERROR);
  });

  it('should run generic router cleanup after handling the request', async () => {
    let cleaned = false;

    setGlobalContext({
      entryName: 'main',
      App: () => React.createElement('div', null, 'app'),
      enableRsc: false,
    });
    setGlobalInternalRuntimeContext({
      hooks: {
        wrapRoot: {
          call: (App: React.ComponentType) => App,
        },
        onBeforeRender: {
          call: async (context: any) => {
            context.routerRuntime = {
              framework: 'custom-router',
              cleanup: () => {
                cleaned = true;
              },
            };
          },
        },
      },
    } as any);

    const { createRequestHandler } = await import(
      '../../../src/core/server/requestHandler'
    );
    const requestHandler = await createRequestHandler(async () => {
      return new Response('ok', { status: 200 });
    });

    const response = await requestHandler(new Request('http://localhost/'), {
      resource: {
        entryName: 'main',
        route: {
          urlPath: '/',
        },
        htmlTemplate: '<html><head></head><body></body></html>',
      } as any,
      config: {
        ssr: true,
      } as any,
      params: {},
      reporter: undefined,
      monitors: undefined,
      locals: {},
      loaderContext: {},
      onTiming: () => {},
      onError: () => {},
    } as any);

    expect(response.status).toBe(200);
    expect(cleaned).toBe(true);
  });
});
