import { once } from 'node:events';
import { Agent, type Server, request as httpRequest } from 'node:http';
import { type Http2Server, connect, createServer } from 'node:http2';
import type { AddressInfo } from 'node:net';
import type { Readable } from 'node:stream';
import { createStaticHandler } from '@modern-js/runtime-utils/router';
import { createMemoryStorage } from '@modern-js/runtime-utils/storer';
import { createNodeServer } from '../../src/adapters/node/node';
import { getCacheResult } from '../../src/plugins/render/ssrCache';
import type { RequestHandlerOptions } from '../../src/types/requestHandler';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

function request(url: string) {
  return new Promise<{ body: string; cache: string | undefined }>(
    (resolve, reject) => {
      const req = httpRequest(url, { agent: new Agent() }, res => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => {
          body += chunk;
        });
        res.on('error', reject);
        res.on('end', () =>
          resolve({
            body,
            cache: res.headers['x-render-cache'] as string | undefined,
          }),
        );
      });
      req.on('error', reject);
      req.end();
    },
  );
}

function requestStream(url: string, protocol: 'http' | 'http2') {
  const response = {
    body: '',
    cache: undefined as string | string[] | undefined,
    ended: false,
    closed: false,
    error: undefined as Error | undefined,
  };
  const onError = (error: Error) => {
    response.error = error;
  };
  const consume = (stream: Readable) => {
    stream.setEncoding('utf8');
    stream.on('data', chunk => {
      response.body += chunk;
    });
    stream.on('end', () => {
      response.ended = true;
    });
    stream.on('close', () => {
      response.closed = true;
    });
    stream.on('error', onError);
  };

  if (protocol === 'http2') {
    const session = connect(url);
    session.on('error', onError);
    const req = session.request({ ':method': 'GET', host: 'localhost' });
    req.on('response', headers => {
      response.cache = headers['x-render-cache'];
    });
    consume(req);
    req.end();
    return {
      response,
      disconnect: () => req.close(),
      dispose: () => session.destroy(),
    };
  }

  const req = httpRequest(url, { agent: false }, res => {
    response.cache = res.headers['x-render-cache'];
    consume(res);
  });
  req.on('error', onError);
  req.end();
  return {
    response,
    disconnect: () => req.destroy(),
    dispose: () => req.destroy(),
  };
}

async function close(server: Server | Http2Server) {
  if ('closeAllConnections' in server) server.closeAllConnections();
  await new Promise<void>((resolve, reject) =>
    server.close(error => (error ? reject(error) : resolve())),
  );
}

it('finishes stale cache revalidation after the HTTP response closes', async () => {
  const container = createMemoryStorage<string>('ssr-cache-response-lifecycle');
  await container.set(
    '/',
    JSON.stringify({ val: 'cached', cursor: Date.now() - 60_000 }),
  );
  const loader = deferred<string>();
  const responseClosed = deferred<void>();
  const router = createStaticHandler([
    { id: 'page', path: '/', loader: () => loader.promise },
  ]);
  const server = await createNodeServer(req =>
    getCacheResult(req, {
      cacheControl: { maxAge: 30_000, staleWhileRevalidate: 300_000 },
      container,
      requestHandlerOptions: {} as RequestHandlerOptions,
      requestHandler: async request => {
        const context = await router.query(request);
        if (context instanceof Response) return context;
        return new Response(context.loaderData.page);
      },
    }),
  );
  server.on('request', (_req, res) => {
    res.once('close', () => responseClosed.resolve());
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
  try {
    expect(await request(url)).toEqual({ body: 'cached', cache: 'stale' });
    await responseClosed.promise;
    loader.resolve('fresh');
    await expect
      .poll(async () => JSON.parse((await container.get('/'))!).val)
      .toBe('fresh');
    expect(await request(url)).toEqual({ body: 'fresh', cache: 'hit' });
  } finally {
    loader.resolve('fresh');
    await close(server as Server);
    await container.delete('/');
  }
});

it.each(['render', 'stream'])(
  'keeps the cached response when revalidation fails in the %s',
  async failure => {
    const container = createMemoryStorage<string>(`ssr-cache-error-${failure}`);
    await container.set(
      '/',
      JSON.stringify({ val: 'cached', cursor: Date.now() - 60_000 }),
    );
    const error = new Error('render failed');
    const errors: unknown[] = [];
    const response = await getCacheResult(new Request('http://localhost/'), {
      cacheControl: { maxAge: 30_000, staleWhileRevalidate: 300_000 },
      container,
      requestHandlerOptions: {
        onError: error => {
          errors.push(error);
        },
      } as RequestHandlerOptions,
      requestHandler: async () => {
        if (failure === 'stream') {
          return new Response(
            new ReadableStream({
              start(controller) {
                controller.enqueue(new TextEncoder().encode('partial'));
                setTimeout(() => controller.error(error), 0);
              },
            }),
          );
        }
        throw error;
      },
    });
    expect(await response.text()).toBe('cached');
    await expect.poll(() => errors).toEqual([error]);
    expect(JSON.parse((await container.get('/'))!).val).toBe('cached');
    await container.delete('/');
  },
);

describe.each(['http', 'http2'] as const)(
  '%s cached streaming responses',
  protocol => {
    describe.each(['miss', 'expired'] as const)('%s', cacheStatus => {
      it.each(['complete', 'disconnect', 'error', 'slow cache write'] as const)(
        'handles %s after delivering the first chunk',
        async outcome => {
          const container = createMemoryStorage<string>(
            `ssr-cache-stream-${protocol}-${cacheStatus}-${outcome}`,
          );
          const previous =
            cacheStatus === 'expired'
              ? JSON.stringify({ val: 'cached', cursor: Date.now() - 400_000 })
              : undefined;
          if (previous) await container.set('/', previous);
          const originalSet = container.set.bind(container);
          const setCache = rstest.spyOn(container, 'set');
          const finishCacheWrite = deferred<void>();
          if (outcome === 'slow cache write') {
            setCache.mockImplementation(async (...args) => {
              await finishCacheWrite.promise;
              return originalSet(...args);
            });
          }
          const cancel = rstest.fn();
          const encoder = new TextEncoder();
          const firstChunk = '<html><body>shell';
          const lastChunk = 'content</body></html>';
          let controller!: ReadableStreamDefaultController<Uint8Array>;
          let sourceFinished = false;
          const stream = new ReadableStream<Uint8Array>({
            start(source) {
              controller = source;
              source.enqueue(encoder.encode(firstChunk));
            },
            cancel(reason) {
              sourceFinished = true;
              cancel(reason);
            },
          });
          const adapter = await createNodeServer(req =>
            getCacheResult(req, {
              cacheControl: { maxAge: 30_000, staleWhileRevalidate: 300_000 },
              container,
              requestHandlerOptions: {} as RequestHandlerOptions,
              requestHandler: async () =>
                new Response(stream, {
                  headers: { 'Content-Type': 'text/html' },
                }),
            }),
          );
          const server =
            protocol === 'http'
              ? adapter
              : createServer(adapter.getRequestListener());
          server.listen(0, '127.0.0.1');
          await once(server, 'listening');
          const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
          const client = requestStream(url, protocol);
          const { response } = client;

          try {
            // Do not produce the remaining HTML until the HTTP client receives
            // the shell. Buffering the entire response would fail this assertion.
            await expect.poll(() => response.body).toBe(firstChunk);
            expect(response.cache).toBe(cacheStatus);
            expect(response.ended).toBe(false);
            expect(response.error).toBeUndefined();
            expect(setCache).not.toHaveBeenCalled();

            if (outcome === 'complete' || outcome === 'slow cache write') {
              controller.enqueue(encoder.encode(lastChunk));
              controller.close();
              sourceFinished = true;
              await expect.poll(() => response.ended).toBe(true);
              expect(response.body).toBe(firstChunk + lastChunk);
              expect(response.error).toBeUndefined();
              await expect.poll(() => setCache.mock.calls.length).toBe(1);
              if (outcome === 'slow cache write') {
                // The HTTP response must finish before cache writing is released.
                expect(await container.get('/')).toBe(previous);
                finishCacheWrite.resolve();
              }
              await expect
                .poll(async () => {
                  const cached = await container.get('/');
                  return cached ? JSON.parse(cached).val : undefined;
                })
                .toBe(firstChunk + lastChunk);
              expect(cancel).not.toHaveBeenCalled();
            } else {
              if (outcome === 'disconnect') {
                client.disconnect();
                // The source has no next chunk: cancellation must reach it even
                // while the cache copy is waiting for another read.
                await expect.poll(() => cancel.mock.calls.length).toBe(1);
                expect(response.body).toBe(firstChunk);
              } else {
                controller.error(new Error('SSR stream failed'));
                sourceFinished = true;
                await expect.poll(() => response.error).toBeDefined();
              }
              await expect.poll(() => response.closed).toBe(true);
              if (outcome === 'error') expect(response.ended).toBe(false);
              expect(setCache).not.toHaveBeenCalled();
              expect(await container.get('/')).toBe(previous);
            }
          } finally {
            finishCacheWrite.resolve();
            if (!sourceFinished) controller.close();
            client.dispose();
            await close(server);
            await container.delete('/');
          }
        },
      );
    });
  },
);
