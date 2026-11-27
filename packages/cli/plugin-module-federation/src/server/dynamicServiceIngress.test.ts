import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import { afterEach, describe, expect, it } from '@rstest/core';
import { createBridgeServiceHandler } from '@module-federation/bridge-react/service-node';
import { createBridgeServiceIngressMiddleware } from './service';

const DYNAMIC_SERVICE_REMOTES_SYMBOL = Symbol.for(
  'modern-js.mf.applications.service-remotes',
);
const protocol = 'module-federation/bridge-ssr/producer/v1' as const;
const servers: Server[] = [];

afterEach(async () => {
  delete (globalThis as Record<symbol, unknown>)[
    DYNAMIC_SERVICE_REMOTES_SYMBOL
  ];
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});

describe('dynamic Service App ingress admission', () => {
  it('rejects unknown modules and proxies committed dynamically discovered Service Apps end-to-end', async () => {
    let serviceOrigin = '';
    const producerHandler = createBridgeServiceHandler({
      buildVersion: () => 'shop-build-1',
      async render() {
        return {
          protocol,
          hydration: 'progressive' as const,
          abort() {},
          messages: new ReadableStream({
            start(controller) {
              controller.enqueue({
                type: 'html' as const,
                html: '<div>DynamicServiceHTML</div>',
              });
              controller.enqueue({
                type: 'ready' as const,
                snapshot: { ok: true },
              });
              controller.enqueue({ type: 'done' as const });
              controller.close();
            },
          }),
          stylesheets: [],
        };
      },
    });

    const server = createServer(async (req, res) => {
      if (req.url === '/shop/mf-manifest.json') {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            id: 'shop',
            name: 'shop',
            metaData: {
              name: 'shop',
              type: 'app',
              buildInfo: { buildVersion: 'shop-build-1', buildName: 'shop' },
              remoteEntry: { name: 'remoteEntry.js', path: '', type: 'global' },
              globalName: 'shop',
              publicPath: `${serviceOrigin}/shop/`,
              serviceBaseUrl: serviceOrigin,
            },
            exposes: [
              {
                id: 'shop:App',
                name: 'App',
                path: './App',
                render: 'bridge',
                servicePath: '__service/shop/App',
                assets: {
                  js: { sync: [], async: [] },
                  css: { sync: [], async: [] },
                },
              },
            ],
            shared: [],
            remotes: [],
          }),
        );
        return;
      }
      if (req.url === '/__service/shop/App' && req.method === 'POST') {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        const response = await producerHandler(
          new Request(`${serviceOrigin}${req.url}`, {
            method: 'POST',
            headers: req.headers as Record<string, string>,
            body: Buffer.concat(chunks),
          }),
        );
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
        return;
      }
      res.statusCode = 404;
      res.end('not found');
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    servers.push(server);
    const addr = server.address();
    if (!addr || typeof addr === 'string') throw new Error('Expected TCP port');
    serviceOrigin = `http://127.0.0.1:${addr.port}`;

    const middleware = createBridgeServiceIngressMiddleware(
      {},
      {
        name: 'portal',
        remotes: [],
        allowDynamicRemotes: true,
      },
    );

    const makeRequest = (moduleId: string) =>
      new Request(
        `http://portal.test/_modern/mf/service/${encodeURIComponent(moduleId)}`,
        {
          method: 'POST',
          headers: {
            origin: 'http://portal.test',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            protocol,
            buildVersion: 'shop-build-1',
            request: {
              instanceId: 'shop-1',
              identifierPrefix: 'shop-',
              moduleName: moduleId,
              basename: '/shop',
              url: 'http://portal.test/shop/item',
              props: {},
            },
          }),
        },
      );

    // Undiscovered remote must be rejected with 400
    const rejected = await middleware(
      { req: { raw: makeRequest('unknown/App') }, get: () => undefined },
      async () => {},
    );
    expect(rejected?.status).toBe(400);
    expect(await rejected?.text()).toContain('Unconfigured Service remote');

    // Commit discovered Service remote into shared registry
    (globalThis as Record<symbol, unknown>)[DYNAMIC_SERVICE_REMOTES_SYMBOL] =
      new Map([
        [
          'shop',
          {
            name: 'shop',
            entry: `${serviceOrigin}/shop/mf-manifest.json`,
          },
        ],
      ]);

    const admitted = await middleware(
      { req: { raw: makeRequest('shop/App') }, get: () => undefined },
      async () => {},
    );
    expect(admitted?.status).toBe(200);
    const bodyText = await admitted!.text();
    expect(bodyText).toContain('DynamicServiceHTML');

    await middleware.dispose();
  });
});
