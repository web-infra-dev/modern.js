import { once } from 'node:events';
import { Agent, type Server, request as httpRequest } from 'node:http';
import type { AddressInfo } from 'node:net';
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

async function close(server: Server) {
  server.closeAllConnections();
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
