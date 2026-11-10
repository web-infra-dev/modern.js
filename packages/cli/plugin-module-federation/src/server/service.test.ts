import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import { Readable } from 'node:stream';
import { createInstance } from '@module-federation/enhanced/runtime';
import {
  bridgeServicePlugin,
  createBridgeServiceHandler,
} from '@module-federation/bridge-react/service-node';
import { createBridgeServiceIngressMiddleware } from './service';

const servers: Server[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
const protocol = 'module-federation/bridge-ssr/producer/v1' as const;
const requestBody = (
  moduleName = 'weather/App',
  url = 'https://host.test/service',
) => ({
  protocol,
  buildVersion: 'build-1',
  request: {
    instanceId: 'app',
    identifierPrefix: 'app-',
    moduleName,
    basename: '/service',
    url,
    props: { city: 'Hangzhou' },
    headers: { cookie: 'untrusted-browser-value' },
  },
});
describe('Service same-origin ingress', () => {
  it('uses its trusted binding, keeps service auth separate and allowlists loader headers', async () => {
    const received: { auth?: string; headers?: Record<string, string> }[] = [];
    const handler = createBridgeServiceHandler({
      buildVersion: 'build-1',
      authorize(request) {
        received.push({
          auth: request.headers.get('authorization') || undefined,
        });
      },
      async render(info) {
        received.at(-1)!.headers = info.headers;
        return {
          protocol,
          hydration: 'progressive' as const,
          abort() {},
          messages: new ReadableStream({
            start(controller) {
              controller.enqueue({
                type: 'html' as const,
                html: '<div>weather</div>',
              });
              controller.enqueue({ type: 'ready' as const, snapshot: {} });
              controller.enqueue({ type: 'done' as const });
              controller.close();
            },
          }),
        };
      },
    });
    const server = createServer(async (incoming, outgoing) => {
      const body: Buffer[] = [];
      for await (const chunk of incoming) body.push(Buffer.from(chunk));
      const request = new Request('http://localhost/render', {
        method: 'POST',
        headers: incoming.headers as Record<string, string>,
        body: Buffer.concat(body),
      });
      const response = await handler(request);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers));
      Readable.fromWeb(response.body as any).pipe(outgoing);
    });
    servers.push(server);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address() as { port: number };
    const ingress = createBridgeServiceIngressMiddleware({
      'weather/App': {
        url: `http://127.0.0.1:${address.port}/render`,
        serviceHeaders: { authorization: 'service-only' },
        forwardHeaders: ['cookie'],
      },
    });
    const response = await ingress(
      {
        req: {
          raw: new Request(
            'https://host.test/_modern/mf/service/weather%2FApp',
            {
              method: 'POST',
              headers: {
                origin: 'https://host.test',
                cookie: 'trusted-user-context',
                authorization: 'host-secret',
              },
              body: JSON.stringify(requestBody()),
            },
          ),
        },
      },
      async () => {},
    );
    expect(response?.status).toBe(200);
    expect(await response!.text()).toContain('"type":"ready"');
    expect(received).toEqual([
      { auth: 'service-only', headers: { cookie: 'trusted-user-context' } },
    ]);
  });
  it('uses an explicitly trusted public origin behind TLS termination', async () => {
    const ingress = createBridgeServiceIngressMiddleware(
      {
        'weather/App': { url: 'http://127.0.0.1:1/render' },
      },
      { origin: 'https://host.test' },
    );
    const response = await ingress(
      {
        req: {
          raw: new Request(
            'http://internal.test/_modern/mf/service/weather%2FApp',
            {
              method: 'POST',
              headers: { origin: 'https://host.test' },
              // A mismatched module is rejected after the public-origin check.
              body: JSON.stringify(requestBody('other/App')),
            },
          ),
        },
      },
      async () => {},
    );
    expect(response?.status).toBe(400);
    expect(() =>
      createBridgeServiceIngressMiddleware(
        {},
        { origin: 'https://host.test/path' },
      ),
    ).toThrow('origin');
  });

  it('rejects cross-origin calls before contacting the producer', async () => {
    const ingress = createBridgeServiceIngressMiddleware({
      'weather/App': { url: 'http://127.0.0.1:1/render' },
    });
    const response = await ingress(
      {
        req: {
          raw: new Request(
            'https://host.test/_modern/mf/service/weather%2FApp',
            {
              method: 'POST',
              headers: { origin: 'https://attacker.test' },
              body: JSON.stringify(requestBody()),
            },
          ),
        },
      },
      async () => {},
    );
    expect(response?.status).toBe(403);
  });
  it.each([
    requestBody('other/App'),
    requestBody('weather/App', 'https://other.test/service'),
  ])('rejects a module or page outside the binding', async body => {
    const ingress = createBridgeServiceIngressMiddleware({
      'weather/App': { url: 'http://127.0.0.1:1/render' },
    });
    const response = await ingress(
      {
        req: {
          raw: new Request(
            'https://host.test/_modern/mf/service/weather%2FApp',
            {
              method: 'POST',
              headers: { origin: 'https://host.test' },
              body: JSON.stringify(body),
            },
          ),
        },
      },
      async () => {},
    );
    expect(response?.status).toBe(400);
  });
});

it('diagnoses an unbound Service before Node entry while ordinary exposes still load', async () => {
  const component = { default: () => null };
  const entry = rs.fn(() => ({ init() {}, get: async () => () => component }));
  const runtime = createInstance({
    name: 'unconfigured-service-host',
    shareStrategy: 'loaded-first',
    remotes: [{ name: 'weather', entry: 'https://weather.test/entry.js' }],
    plugins: [
      bridgeServicePlugin({}),
      {
        name: 'test-resolved-service',
        afterResolve: args => ({
          ...args,
          remoteSnapshot: {
            buildVersion: 'build-1',
            version: '1',
            modules: [
              {
                modulePath: './App',
                moduleName: 'App',
                render: 'bridge',
                isService: true,
              },
              { modulePath: './Card', moduleName: 'Card', render: 'component' },
            ],
          } as any,
        }),
        loadEntry: entry,
      },
    ],
  });
  await expect(runtime.loadRemote('weather/App')).rejects.toThrow(
    'has no configured deployment binding',
  );
  expect(entry).not.toHaveBeenCalled();
  expect(await runtime.loadRemote('weather/Card')).toBe(component);
  expect(entry).toHaveBeenCalledTimes(1);
});
