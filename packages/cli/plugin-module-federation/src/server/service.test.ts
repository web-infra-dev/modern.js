import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { createServer, type Server } from 'node:http';
import { once } from 'node:events';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import {
  createInstance,
  registerGlobalPlugins,
} from '@module-federation/enhanced/runtime';
import {
  generateSnapshotFromManifest,
  type Manifest,
} from '@module-federation/sdk';
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

function incoming(
  body = requestBody(),
  headers: Record<string, string> = {},
  url = 'https://host.test/_modern/mf/service/weather%2FApp',
) {
  return {
    req: {
      raw: new Request(url, {
        method: 'POST',
        headers: { origin: 'https://host.test', ...headers },
        body: JSON.stringify(body),
      }),
    },
  };
}

async function producer(root = false) {
  const name = `weather_${randomUUID().replaceAll('-', '')}`;
  const counts = {
    manifest: 0,
    forbiddenManifest: 0,
    nodeEntry: 0,
    service: 0,
  };
  const received: {
    auth: string | null;
    outerCookie: string | null;
    headers?: Record<string, string>;
  }[] = [];
  const render = rs.fn(async info => {
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
          controller.enqueue({
            type: 'ready' as const,
            snapshot: { city: info.props.city },
          });
          controller.enqueue({ type: 'done' as const });
          controller.close();
        },
      }),
    };
  });
  const handler = createBridgeServiceHandler({
    buildVersion: 'build-1',
    authorize(request) {
      received.push({
        auth: request.headers.get('authorization'),
        outerCookie: request.headers.get('cookie'),
      });
    },
    render,
  });
  let origin: string;
  let manifest: Manifest;
  const server = createServer(async (request, response) => {
    if (request.url === '/mf-manifest.json') {
      counts.manifest++;
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(manifest));
      return;
    }
    if (request.url === '/must-not-fetch-manifest.json') {
      counts.forbiddenManifest++;
      response.writeHead(503).end('Snapshot must win');
      return;
    }
    if (request.url === '/assets/node-entry.js') {
      counts.nodeEntry++;
      response.writeHead(503).end('Producer Node entry is blocked');
      return;
    }
    if (request.url !== '/service-base/render/App') {
      response.writeHead(404).end();
      return;
    }
    counts.service++;
    const body: Buffer[] = [];
    for await (const chunk of request) body.push(Buffer.from(chunk));
    const result = await handler(
      new Request(`${origin}${request.url}`, {
        method: 'POST',
        headers: request.headers as Record<string, string>,
        body: Buffer.concat(body),
      }),
    );
    response.writeHead(result.status, Object.fromEntries(result.headers));
    Readable.fromWeb(result.body as any).pipe(response);
  });
  servers.push(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const assets = { js: { sync: [], async: [] }, css: { sync: [], async: [] } };
  manifest = {
    id: name,
    name,
    metaData: {
      name,
      globalName: name,
      type: 'app',
      buildInfo: { buildVersion: 'build-1', buildName: name },
      remoteEntry: { name: 'node-entry.js', path: '', type: 'commonjs-module' },
      ssrRemoteEntry: {
        name: 'node-entry.js',
        path: '',
        type: 'commonjs-module',
      },
      publicPath: `${origin}/assets/`,
      ssrPublicPath: `${origin}/assets/`,
      serviceBaseUrl: `${origin}/service-base/`,
    },
    exposes: [
      {
        id: `${name}:${root ? '.' : 'App'}`,
        name: root ? '.' : 'App',
        path: root ? '.' : './App',
        render: 'bridge',
        servicePath: 'render/App',
        assets,
      },
      {
        id: `${name}:Card`,
        name: 'Card',
        path: './Card',
        render: 'component',
        assets,
      },
    ],
    remotes: [],
    shared: [],
  };
  const remote = {
    name,
    alias: 'weather',
    entry: `${origin}/mf-manifest.json`,
  };
  return { name, origin, manifest, remote, counts, received, render };
}

describe('Service same-origin ingress', () => {
  it('discovers the endpoint from a real manifest and separates service authentication from loader context', async () => {
    const upstream = await producer();
    const ingress = createBridgeServiceIngressMiddleware(
      {
        'weather/App': {
          serviceHeaders: { authorization: 'service-only' },
          forwardHeaders: ['cookie'],
        },
      },
      { name: upstream.name, remotes: [upstream.remote] },
    );
    const response = await ingress(
      incoming(requestBody(), {
        cookie: 'trusted-user-context',
        authorization: 'host-secret',
      }),
      async () => {},
    );
    expect(response?.status).toBe(200);
    const text = await response!.text();
    expect(text).toContain('<div>weather</div>');
    expect(text).toContain('"type":"ready"');
    expect(text).toContain('"type":"done"');
    expect(upstream.received).toEqual([
      {
        auth: 'service-only',
        outerCookie: null,
        headers: { cookie: 'trusted-user-context' },
      },
    ]);
    expect(upstream.counts).toEqual({
      manifest: 1,
      forbiddenManifest: 0,
      nodeEntry: 0,
      service: 1,
    });
    expect(upstream.render).toHaveBeenCalledTimes(1);
  });

  it('serves a configured remote without a Host policy or a hand-written URL', async () => {
    const upstream = await producer();
    const ingress = createBridgeServiceIngressMiddleware(
      {},
      { name: upstream.name, remotes: [upstream.remote] },
    );
    const response = await ingress(incoming(), async () => {});
    expect(response?.status).toBe(200);
    expect(await response!.text()).toContain('"type":"done"');
    expect(upstream.received).toEqual([
      { auth: null, outerCookie: null, headers: {} },
    ]);
    expect(upstream.counts.nodeEntry).toBe(0);
  });

  it.each(['alias', 'canonical'] as const)(
    'serves the root expose by %s ID and finds the policy under its other name',
    async spelling => {
      const upstream = await producer(true);
      const moduleName = spelling === 'alias' ? 'weather' : upstream.name;
      const policyKey = spelling === 'alias' ? upstream.name : 'weather';
      const ingress = createBridgeServiceIngressMiddleware(
        {
          [policyKey]: {
            serviceHeaders: { authorization: 'root-service-auth' },
            forwardHeaders: ['cookie'],
          },
        },
        { name: upstream.name, remotes: [upstream.remote] },
      );
      const response = await ingress(
        incoming(
          requestBody(moduleName),
          { cookie: 'root-user-context' },
          `https://host.test/_modern/mf/service/${encodeURIComponent(moduleName)}`,
        ),
        async () => {},
      );
      expect(response?.status).toBe(200);
      expect(await response!.text()).toContain('"type":"done"');
      expect(upstream.received).toEqual([
        {
          auth: 'root-service-auth',
          outerCookie: null,
          headers: { cookie: 'root-user-context' },
        },
      ]);
      expect(upstream.counts).toEqual({
        manifest: 1,
        forbiddenManifest: 0,
        nodeEntry: 0,
        service: 1,
      });
    },
  );

  it('uses a supplied Snapshot before a deliberately unavailable manifest on its first resolution', async () => {
    const upstream = await producer();
    const entry = `${upstream.origin}/must-not-fetch-manifest.json`;
    const snapshot = generateSnapshotFromManifest(upstream.manifest, {
      version: entry,
    });
    const supplied = rs.fn();
    registerGlobalPlugins([
      {
        name: `provided-snapshot-${upstream.name}`,
        loadSnapshot(args) {
          if (args.moduleInfo.name !== upstream.name) return args;
          supplied();
          return { ...args, remoteSnapshot: snapshot };
        },
      },
    ]);
    const ingress = createBridgeServiceIngressMiddleware(
      {},
      {
        name: upstream.name,
        remotes: [{ ...upstream.remote, entry }],
      },
    );
    const response = await ingress(incoming(), async () => {});
    expect(response?.status).toBe(200);
    expect(await response!.text()).toContain('"type":"done"');
    expect(supplied).toHaveBeenCalledTimes(1);
    expect(upstream.counts).toEqual({
      manifest: 0,
      forbiddenManifest: 0,
      nodeEntry: 0,
      service: 1,
    });
  });

  it('replaces scoped ingress discovery after a plugin rebuild without retaining global runtime instances', async () => {
    const initial = await producer();
    const updated = await producer();
    const selected = (upstream: Awaited<ReturnType<typeof producer>>) => [
      {
        name: 'local-deployment-selection',
        loadSnapshot: (args: any) => ({
          ...args,
          remoteSnapshot: generateSnapshotFromManifest(upstream.manifest, {
            version: upstream.remote.entry,
          }),
        }),
      },
    ];
    let plugins = selected(initial);
    const before = [
      ...((globalThis as any).__FEDERATION__.__INSTANCES__ || []),
    ];
    const ingress = createBridgeServiceIngressMiddleware(
      {},
      {
        name: initial.name,
        remotes: [initial.remote],
        plugins: async () => plugins,
      },
    );
    const request = async () => {
      const result = await ingress(incoming(), async () => {});
      expect(result?.status).toBe(200);
      expect(await result!.text()).toContain('"type":"done"');
    };
    await request();
    await request();
    expect(initial.counts.service).toBe(2);
    plugins = selected(updated);
    await request();
    await request();
    expect(initial.counts.service).toBe(2);
    expect(updated.counts.service).toBe(2);
    expect(initial.counts.manifest + updated.counts.manifest).toBe(0);
    expect((globalThis as any).__FEDERATION__.__INSTANCES__).toEqual(before);
  });

  it('rejects a stale browser build before contacting the producer renderer', async () => {
    const upstream = await producer();
    const ingress = createBridgeServiceIngressMiddleware(
      {},
      { name: upstream.name, remotes: [upstream.remote] },
    );
    const response = await ingress(
      incoming({ ...requestBody(), buildVersion: 'stale-build' }),
      async () => {},
    );
    expect(response?.status).toBe(409);
    expect(upstream.counts.manifest).toBe(1);
    expect(upstream.counts.service).toBe(0);
    expect(upstream.render).not.toHaveBeenCalled();
  });

  it('uses an explicitly trusted public origin behind TLS termination', async () => {
    const upstream = await producer();
    const ingress = createBridgeServiceIngressMiddleware(
      {},
      {
        origin: 'https://host.test',
        name: upstream.name,
        remotes: [upstream.remote],
      },
    );
    const response = await ingress(
      incoming(
        requestBody(),
        {},
        'http://internal.test/_modern/mf/service/weather%2FApp',
      ),
      async () => {},
    );
    expect(response?.status).toBe(200);
    expect(await response!.text()).toContain('"type":"done"');
    expect(() =>
      createBridgeServiceIngressMiddleware(
        {},
        { origin: 'https://host.test/path' },
      ),
    ).toThrow('origin');
  });

  it.each([
    { origin: 'https://attacker.test' },
    { 'sec-fetch-site': 'cross-site' },
  ])(
    'rejects cross-origin calls before resolving or rendering the remote: %s',
    async headers => {
      const upstream = await producer();
      const ingress = createBridgeServiceIngressMiddleware(
        {},
        { name: upstream.name, remotes: [upstream.remote] },
      );
      const response = await ingress(
        incoming(requestBody(), headers),
        async () => {},
      );
      expect(response?.status).toBe(403);
      expect(upstream.counts).toEqual({
        manifest: 0,
        forbiddenManifest: 0,
        nodeEntry: 0,
        service: 0,
      });
    },
  );

  it.each([
    requestBody('other/App'),
    requestBody('weather/App', 'https://other.test/service'),
  ])(
    'rejects a module or page outside the selected request before fetching metadata',
    async body => {
      const upstream = await producer();
      const ingress = createBridgeServiceIngressMiddleware(
        {},
        { name: upstream.name, remotes: [upstream.remote] },
      );
      const response = await ingress(incoming(body), async () => {});
      expect(response?.status).toBe(400);
      expect(upstream.counts.manifest).toBe(0);
      expect(upstream.render).not.toHaveBeenCalled();
    },
  );

  it('rejects an unconfigured remote and malformed module encoding', async () => {
    const upstream = await producer();
    const ingress = createBridgeServiceIngressMiddleware(
      {},
      { name: upstream.name, remotes: [upstream.remote] },
    );
    for (const path of ['other%2FApp', 'weather%2fApp', '%ZZ']) {
      const response = await ingress(
        incoming(
          requestBody(),
          {},
          `https://host.test/_modern/mf/service/${path}`,
        ),
        async () => {},
      );
      expect(response?.status).toBe(400);
    }
    expect(upstream.counts.manifest).toBe(0);
    expect(upstream.render).not.toHaveBeenCalled();
  });
});

it('diagnoses missing Service deployment before Node entry while an ordinary expose reaches the entry probe', async () => {
  const upstream = await producer();
  const snapshot = generateSnapshotFromManifest(upstream.manifest, {
    version: upstream.remote.entry,
  });
  delete snapshot.serviceBaseUrl;
  const component = { default: () => null };
  const entry = rs.fn(async () => {
    await fetch(`${upstream.origin}/assets/node-entry.js`);
    return { init() {}, get: async () => () => component };
  });
  const runtime = createInstance({
    name: `${upstream.name}_missing_service_host`,
    shareStrategy: 'loaded-first',
    remotes: [upstream.remote],
    plugins: [
      bridgeServicePlugin({}),
      {
        name: `missing-service-base-${upstream.name}`,
        loadSnapshot(args) {
          return args.moduleInfo.name === upstream.name
            ? { ...args, remoteSnapshot: snapshot }
            : args;
        },
        loadEntry: entry,
      },
    ],
  });
  await expect(runtime.loadRemote('weather/App')).rejects.toThrow(
    'serviceBaseUrl',
  );
  expect(entry).not.toHaveBeenCalled();
  expect(upstream.counts.nodeEntry).toBe(0);
  expect(await runtime.loadRemote('weather/Card')).toBe(component);
  expect(entry).toHaveBeenCalledTimes(1);
  expect(upstream.counts.nodeEntry).toBe(1);
});
