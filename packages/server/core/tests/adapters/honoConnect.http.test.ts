import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createServerBase } from '../../src/serverBase';
import { createSSRApplication } from '../../src/adapters/node/application';
import {
  connectMid2HonoMid,
  connectMockMid2HonoMid,
  httpCallBack2HonoMid,
} from '../../src/adapters/node/hono';
import { createNodeServer } from '../../src/adapters/node/node';
import { getDefaultAppContext, getDefaultConfig } from '../helpers';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
async function fixture(
  handler: Parameters<typeof connectMid2HonoMid>[0],
  bridge = connectMid2HonoMid,
) {
  const application = await createSSRApplication({
    maxPendingRequests: 2,
    requestTimeoutMs: 1000,
    drainTimeoutMs: 1000,
    load: async () => ({
      templates: {},
      serverManifest: {},
      render: async () => new Response('ready'),
    }),
  });
  const app = createServerBase({
    pwd: '',
    config: getDefaultConfig(),
    appContext: getDefaultAppContext(),
  });
  app.setRequestMiddleware(application.middleware);
  app.onError((error, context) => context.text(error.message, 500));
  app.use('*', bridge(handler));
  app.get('/next', context => context.text('next'));
  const server = await createNodeServer(app.handle);
  server.listen(Number(process.env.JO_PORT_NATIVE || 0), '127.0.0.1');
  await once(server, 'listening');
  return {
    application,
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    async close() {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve())),
      );
    },
  };
}
it.each([2, 3])(
  'retires a native asset response from a %s-argument Connect handler before the next publication',
  async arity => {
    const handler =
      arity === 2
        ? (_req: any, res: any) => {
            res.end('asset');
          }
        : (_req: any, res: any, _next: any) => {
            res.end('asset');
          };
    const f = await fixture(handler);
    try {
      expect(await (await fetch(f.url)).text()).toBe('asset');
      await expect(f.application.update(async () => {})).resolves.toBe(1);
      expect(f.application.status.activeRequests).toBe(0);
    } finally {
      await f.close();
    }
  },
);
it('releases native transport on disconnect while retaining its returned producer promise', async () => {
  const producer = deferred();
  const f = await fixture((_req, res) => {
    res.write('stream');
    return producer.promise;
  });
  const abort = new AbortController();
  try {
    const response = await fetch(f.url, { signal: abort.signal });
    await response.body!.getReader().read();
    abort.abort();
    let published = false;
    const update = f.application.update(async () => {
      published = true;
    });
    await new Promise(resolve => setImmediate(resolve));
    expect(published).toBe(false);
    producer.resolve();
    await update;
    expect(f.application.status.activeRequests).toBe(0);
  } finally {
    producer.resolve();
    await f.close();
  }
});
it.each(['throw', 'reject', 'next'])(
  'cleans native completion listeners on %s without retaining the request owner',
  async outcome => {
    const f = await fixture((_req, _res, next) => {
      if (outcome === 'throw') throw new Error('sync error');
      if (outcome === 'reject') return Promise.reject(new Error('async error'));
      next();
    });
    try {
      const response = await fetch(`${f.url}/next`);
      expect(await response.text()).toBe(
        outcome === 'next'
          ? 'next'
          : outcome === 'throw'
            ? 'sync error'
            : 'async error',
      );
      await expect(f.application.update(async () => {})).resolves.toBe(1);
      expect(f.application.status.activeRequests).toBe(0);
    } finally {
      await f.close();
    }
  },
);

it('retains a partially-written native response until end, without an extra producer promise', async () => {
  let end!: () => void;
  const f = await fixture((_req, res) => {
    res.write('partial');
    end = () => res.end();
  });
  try {
    const response = await fetch(f.url);
    const reader = response.body!.getReader();
    await reader.read();
    let published = false;
    const update = f.application.update(async () => {
      published = true;
    });
    await new Promise(resolve => setImmediate(resolve));
    expect(published).toBe(false);
    end();
    await reader.read();
    await update;
    expect(f.application.status.activeRequests).toBe(0);
  } finally {
    end?.();
    await f.close();
  }
});

it.each(['mock', 'callback'])(
  'retires a native %s response without an unread synthetic Hono body',
  async kind => {
    const bridge =
      kind === 'mock' ? connectMockMid2HonoMid : httpCallBack2HonoMid;
    const f = await fixture(
      (_req, res) => {
        res.end('native');
      },
      bridge as typeof connectMid2HonoMid,
    );
    try {
      expect(await (await fetch(f.url)).text()).toBe('native');
      await expect(f.application.update(async () => {})).resolves.toBe(1);
    } finally {
      await f.close();
    }
  },
);
