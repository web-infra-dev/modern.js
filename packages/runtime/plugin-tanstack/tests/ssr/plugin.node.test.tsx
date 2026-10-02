import { Transform } from 'node:stream';
import {
  type TInternalRuntimeContext,
  setGlobalContext,
} from '@modern-js/runtime/context';
import { registerPlugin } from '@modern-js/runtime/plugin';
import type { RuntimePlugin } from '@modern-js/runtime/plugin';
import type { HandleRequest } from '@modern-js/runtime/ssr/server';
import type { AnyRouter } from '@tanstack/react-router';
import React from 'react';
import { tanstackRouterPlugin } from '../../src/runtime/plugin.node';

const htmlTemplate =
  '<html><head></head><body><div id="root"><!--<?- html ?>--></div><!--<?- SSRDataScript ?>--></body></html>';
const activeReaders = new Set<ReadableStreamDefaultReader<Uint8Array>>();
const activeRouters = new Set<AnyRouter>();

beforeEach(() => {
  (
    globalThis as typeof globalThis & {
      __webpack_require__?: { u: (chunkId: unknown) => string };
    }
  ).__webpack_require__ = { u: chunkId => String(chunkId) };
});

afterEach(async () => {
  for (const reader of activeReaders) {
    await reader.cancel();
    reader.releaseLock();
  }
  activeReaders.clear();
  for (const router of activeRouters) {
    router.serverSsr?.cleanup();
  }
  activeRouters.clear();
});

async function createFixture({
  loader = () => ({}),
  handleRequest,
  plugins = [],
}: {
  loader?: (request: Request) => unknown;
  handleRequest?: HandleRequest;
  plugins?: RuntimePlugin[];
} = {}) {
  const { createRequestHandler, renderStreaming } = await import(
    '@modern-js/runtime/ssr/server'
  );
  const states: Array<{
    router: AnyRouter;
    cleanupCalls: number;
    requestUrl: string;
  }> = [];
  setGlobalContext({ entryName: 'main', enableRsc: false });
  registerPlugin([
    tanstackRouterPlugin({
      createRoutes: () => [
        {
          id: 'root',
          path: '/',
          loader: ({ request }) => loader(request),
          Component: () => <div>response shell</div>,
        },
      ],
    }),
    {
      name: 'observe-test-router',
      setup: api => {
        api.onBeforeRender(context => {
          const router = context.routerInstance as AnyRouter;
          const state = {
            router,
            cleanupCalls: 0,
            requestUrl: context.ssrContext!.request.raw.url,
          };
          const serverSsr = router.serverSsr!;
          const cleanup = serverSsr.cleanup;
          serverSsr.cleanup = () => {
            state.cleanupCalls++;
            cleanup();
          };
          states.push(state);
          activeRouters.add(router);
        });
      },
    },
    ...plugins,
  ]);
  const requestHandler = await createRequestHandler(
    handleRequest ??
      (async (request, ServerRoot, options) =>
        new Response(await renderStreaming(request, <ServerRoot />, options))),
  );

  return {
    states,
    send: (query = '') =>
      requestHandler(new Request(`http://localhost/${query}`), {
        resource: {
          entryName: 'main',
          route: { urlPath: '/' },
          htmlTemplate,
        },
        config: { ssr: true, nonce: 'test-nonce' },
        params: {},
        locals: {},
        loaderContext: {},
        onTiming: () => {},
        onError: error => {
          throw error;
        },
      } as any),
  };
}

async function readShell(response: Response) {
  const reader = response.body!.getReader();
  activeReaders.add(reader);
  const decoder = new TextDecoder();
  const shell = await reader.read();
  const html = decoder.decode(shell.value, { stream: true });
  expect(html).toContain('response shell');
  return { reader, decoder, html };
}

async function readRemainder({
  reader,
  decoder,
  html,
}: Awaited<ReturnType<typeof readShell>>) {
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      activeReaders.delete(reader);
      reader.releaseLock();
      return html + decoder.decode();
    }
    html += decoder.decode(chunk.value, { stream: true });
  }
}

describe('TanStack streaming SSR', () => {
  test('streams loader promises that resolve after the response shell', async () => {
    let resolveLoader!: (value: string) => void;
    const deferred = new Promise<string>(resolve => {
      resolveLoader = resolve;
    });
    const fixture = await createFixture({ loader: () => ({ deferred }) });
    const shell = await readShell(await fixture.send());
    expect(shell.html).not.toContain('serialized-after-shell');
    expect(fixture.states[0].cleanupCalls).toBe(0);

    const remainder = readRemainder(shell);
    resolveLoader('serialized-after-shell');
    const html = await remainder;

    expect(html).toContain('serialized-after-shell');
    expect(html).toContain("<script nonce='test-nonce'>");
    expect(html.indexOf('serialized-after-shell')).toBeLessThan(
      html.indexOf('</body>'),
    );
    expect(fixture.states[0].router.serverSsr).toBeUndefined();
    expect(fixture.states[0].cleanupCalls).toBe(1);
  });

  test('keeps concurrent request serialization separate', async () => {
    let resolveFirst!: (value: string) => void;
    let resolveSecond!: (value: string) => void;
    const first = new Promise<string>(resolve => {
      resolveFirst = resolve;
    });
    const second = new Promise<string>(resolve => {
      resolveSecond = resolve;
    });
    const fixture = await createFixture({
      loader: request => ({
        deferred:
          new URL(request.url).searchParams.get('id') === 'first'
            ? first
            : second,
      }),
    });
    const responses = await Promise.all([
      fixture.send('?id=first'),
      fixture.send('?id=second'),
    ]);
    const [firstShell, secondShell] = await Promise.all(
      responses.map(readShell),
    );
    const firstHtml = readRemainder(firstShell);
    resolveFirst('first-request-value');
    expect(await firstHtml).toContain('first-request-value');
    expect(
      fixture.states.find(state => state.requestUrl.endsWith('?id=second'))!
        .cleanupCalls,
    ).toBe(0);

    const secondHtml = readRemainder(secondShell);
    resolveSecond('second-request-value');
    const html = await secondHtml;
    expect(html).toContain('second-request-value');
    expect(html).not.toContain('first-request-value');
    expect(fixture.states.map(state => state.cleanupCalls)).toEqual([1, 1]);
  });

  test('cleans up cancelled streams while loader serialization is pending', async () => {
    const deferred = new Promise<string>(() => {});
    const fixture = await createFixture({ loader: () => ({ deferred }) });
    const shell = await readShell(await fixture.send());
    expect(fixture.states[0].cleanupCalls).toBe(0);

    await shell.reader.cancel();
    activeReaders.delete(shell.reader);
    shell.reader.releaseLock();

    expect(fixture.states[0].router.serverSsr).toBeUndefined();
    expect(fixture.states[0].cleanupCalls).toBe(1);
  });

  test('cleans up when the handler fails before transferring the stream', async () => {
    const error = new Error('request handler failed');
    const fixture = await createFixture({
      handleRequest: async () => {
        throw error;
      },
    });

    await expect(fixture.send()).rejects.toBe(error);
    expect(fixture.states[0].router.serverSsr).toBeUndefined();
    expect(fixture.states[0].cleanupCalls).toBe(1);
  });

  test('rejects and cleans up when a final HTML processor throws', async () => {
    const error = new Error('HTML processor failed');
    const deferred = new Promise<string>(() => {});
    const fixture = await createFixture({
      loader: () => ({ deferred }),
      plugins: [
        {
          name: 'throwing-html-processor',
          setup: api => {
            api.extendStreamSSR(() => ({
              processHtmlStream: () => {
                throw error;
              },
            }));
          },
        },
      ],
    });

    await expect(fixture.send()).rejects.toBe(error);
    await new Promise<void>(resolve => setImmediate(resolve));
    expect(fixture.states[0].router.serverSsr).toBeUndefined();
    expect(fixture.states[0].cleanupCalls).toBe(1);
  });

  test('preserves the existing raw React stream processor', async () => {
    let rawHtml = '';
    const fixture = await createFixture({
      plugins: [
        {
          name: 'existing-stream-processor',
          setup: api => {
            api.extendStreamSSR(() => ({
              processStream: stream => {
                return stream.pipe(
                  new Transform({
                    transform(chunk, _encoding, callback) {
                      rawHtml += chunk.toString();
                      callback(null, chunk);
                    },
                  }),
                );
              },
            }));
          },
        },
      ],
    });

    const response = await fixture.send();
    expect(await response.text()).toContain('response shell');
    expect(rawHtml).toContain('response shell');
    expect(rawHtml).not.toContain('<html>');
    expect(rawHtml).not.toContain('window._SSR_DATA');
    expect(fixture.states[0].cleanupCalls).toBe(1);
  });

  test.each(['stream', 'string'] as const)(
    'preserves built-in React Router %s SSR without a final HTML processor',
    async mode => {
      const { routerPlugin } = await import(
        '../../../plugin-runtime/dist/esm/router/runtime/plugin.node.mjs'
      );
      const { createRequestHandler, renderStreaming, renderString } =
        await import('@modern-js/runtime/ssr/server');
      let runtimeContext!: TInternalRuntimeContext;
      let cleanupCalls = 0;
      setGlobalContext({ entryName: 'main', enableRsc: false });
      registerPlugin([
        routerPlugin({
          createRoutes: () => [
            {
              id: 'root',
              path: '/',
              loader: () =>
                Response.json(
                  { message: 'built-in-loader-data' },
                  {
                    status: 201,
                  },
                ),
              Component: () => <div>built-in route</div>,
            },
          ],
        }),
        {
          name: 'observe-built-in-router',
          setup: api => {
            api.onBeforeRender(context => {
              runtimeContext = context;
              const cleanup = context.routerRuntime!.cleanup;
              context.routerRuntime!.cleanup = () => {
                cleanupCalls++;
                return cleanup?.();
              };
            });
          },
        },
      ]);
      const requestHandler = await createRequestHandler(
        async (request, ServerRoot, options) =>
          new Response(
            await (mode === 'stream' ? renderStreaming : renderString)(
              request,
              <ServerRoot />,
              options,
            ),
          ),
      );
      const response = await requestHandler(new Request('http://localhost/'), {
        resource: { entryName: 'main', route: { urlPath: '/' }, htmlTemplate },
        config: { ssr: { mode }, nonce: 'test-nonce' },
        params: {},
        locals: {},
        loaderContext: {},
        onTiming: () => {},
        onError: error => {
          throw error;
        },
      } as any);
      const html = await response.text();

      expect(response.status).toBe(201);
      expect(runtimeContext.routerServerSnapshot?.framework).toBe(
        'react-router',
      );
      expect(runtimeContext.routerServerSnapshot?.statusCode).toBe(201);
      expect(runtimeContext.routerContext?.loaderData).toEqual({
        root: { message: 'built-in-loader-data' },
      });
      expect(
        runtimeContext.routerServerSnapshot?.routerData?.loaderData,
      ).toEqual(runtimeContext.routerContext?.loaderData);
      expect(html).toContain('built-in route');
      expect(html).toContain('built-in-loader-data');
      expect(html).not.toContain('$tsr-stream-barrier');
      expect(cleanupCalls).toBe(1);
    },
  );
});
