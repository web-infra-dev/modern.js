import { rstest } from '@rstest/core';
import { Hono } from 'hono';
import { createSSRApplication } from '../../src/adapters/node/application';

const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
}
const limits = {
  maxPendingRequests: 2,
  requestTimeoutMs: 1000,
  drainTimeoutMs: 1000,
};

it('keeps a failed first load unavailable and recovers through request synchronization', async () => {
  let available = false;
  const error = new Error('provider is starting');
  const dispose = rstest.fn(async () => {});
  const onInitialError = rstest.fn();
  const onAvailabilityChange = rstest.fn();
  let application: Awaited<ReturnType<typeof createSSRApplication>>;
  const load = rstest.fn(async () => {
    if (!available) throw error;
    return {
      templates: { main: 'recovered' },
      serverManifest: {},
      render: async () => new Response('ok'),
    };
  });
  await expect(createSSRApplication({ ...limits, load })).rejects.toBe(error);
  application = await createSSRApplication({
    ...limits,
    load,
    dispose,
    onInitialError,
    onAvailabilityChange,
    beforeRequest: async () => {
      if (available && application.status.phase === 'unavailable')
        await application.update(async () => {});
    },
  });
  const app = new Hono();
  app.use('*', application.middleware);
  const handler = rstest.fn(c => c.text(c.get('templates').main));
  app.get('/', handler);
  expect((await app.request('/')).status).toBe(503);
  expect(handler).not.toHaveBeenCalled();
  expect(onInitialError).toHaveBeenCalledWith(error);
  expect(dispose).toHaveBeenCalledWith(undefined);
  expect(onAvailabilityChange).toHaveBeenLastCalledWith(false);
  available = true;
  expect(await (await app.request('/')).text()).toBe('recovered');
  expect(application.status.phase).toBe('serving');
  expect(onAvailabilityChange).toHaveBeenLastCalledWith(true);
});

it('checks before admission without self-draining or replaying a POST body and skips bypasses', async () => {
  let version = 'old';
  let application: Awaited<ReturnType<typeof createSSRApplication>>;
  const beforeRequest = rstest.fn(async () => {
    if (version === 'old')
      await application.update(async () => {
        version = 'new';
      });
  });
  application = await createSSRApplication({
    ...limits,
    beforeRequest,
    bypass: async request =>
      new URL(request.url).pathname === '/live'
        ? new Response('alive')
        : undefined,
    load: async () => ({
      templates: { main: version },
      serverManifest: {},
      render: async () => new Response(version),
    }),
  });
  const app = new Hono();
  app.use('*', application.middleware);
  const handler = rstest.fn(async c =>
    c.text(`${c.get('templates').main}:${await c.req.text()}`),
  );
  app.post('/', handler);
  expect(await (await app.request('/live')).text()).toBe('alive');
  expect(beforeRequest).not.toHaveBeenCalled();
  expect(
    await (await app.request('/', { method: 'POST', body: 'once' })).text(),
  ).toBe('new:once');
  expect(handler).toHaveBeenCalledTimes(1);
});

it('selects fresh resources after admission and drains registered work after response completion', async () => {
  let version = 'old';
  const load = rstest.fn(async () => ({
    templates: { main: version },
    serverManifest: {},
    render: async () => new Response(version),
  }));
  const application = await createSSRApplication({ ...limits, load });
  const app = new Hono();
  app.use('*', application.middleware);
  const outstanding = deferred();
  app.get('/', c => {
    if (c.get('templates').main === 'old')
      c.get('ssrWork').track(outstanding.promise);
    return c.text(c.get('templates').main);
  });
  expect(await (await app.request('/')).text()).toBe('old');
  const mutation = rstest.fn(async () => {
    version = 'new';
  });
  const update = application.update(mutation);
  await tick();
  const queued = app.request('/');
  await tick();
  expect(mutation).not.toHaveBeenCalled();
  expect(load).toHaveBeenCalledTimes(1);
  outstanding.resolve();
  await expect(update).resolves.toBe(1);
  expect(await (await queued).text()).toBe('new');
  expect(load).toHaveBeenCalledTimes(2);
});

it('failed resource preparation stays closed and retry publishes a fresh cache namespace', async () => {
  let fail = false;
  const application = await createSSRApplication({
    ...limits,
    load: async () => {
      if (fail) throw new Error('invalid bundle');
      return {
        templates: {},
        serverManifest: {},
        render: async () => new Response('ok'),
      };
    },
  });
  const app = new Hono();
  app.use('*', application.middleware);
  app.get('/', c => c.text(c.get('ssrCacheNamespace')));
  const before = await (await app.request('/')).text();
  await expect(
    application.update(async () => {
      fail = true;
    }),
  ).rejects.toThrow('invalid bundle');
  expect((await app.request('/')).status).toBe(503);
  await expect(
    application.update(async () => {
      fail = false;
    }),
  ).resolves.toBe(1);
  expect(await (await app.request('/')).text()).not.toBe(before);
});

it('explicit bypass responds without touching application resources during update', async () => {
  const application = await createSSRApplication({
    ...limits,
    bypass: async request =>
      new URL(request.url).pathname === '/live'
        ? new Response('alive')
        : undefined,
    load: async () => ({
      templates: {},
      serverManifest: {},
      render: async () => new Response('ok'),
    }),
  });
  const app = new Hono();
  app.use('*', application.middleware);
  const business = rstest.fn(c => c.text('app'));
  app.get('*', business);
  const wait = deferred();
  const update = application.update(() => wait.promise);
  await tick();
  expect(await (await app.request('/live')).text()).toBe('alive');
  expect(business).not.toHaveBeenCalled();
  wait.resolve();
  await update;
});

it('rejects an invalid update callback without closing admission', async () => {
  const application = await createSSRApplication({
    ...limits,
    load: async () => ({
      templates: {},
      serverManifest: {},
      render: async () => new Response('ok'),
    }),
  });
  await expect(application.update(undefined as any)).rejects.toThrow(
    'invalidator',
  );
  expect(application.status.phase).toBe('serving');
});

it('defers an application update until the submitting response and producer finish', async () => {
  let version = 'old';
  const application = await createSSRApplication({
    ...limits,
    load: async () => ({
      templates: { main: version },
      serverManifest: {},
      render: async () => new Response(version),
    }),
  });
  const app = new Hono();
  app.use('*', application.middleware);
  const producer = deferred();
  let completed: Promise<number> | undefined;
  app.get('/', c => {
    if (c.get('templates').main === 'old') {
      c.get('ssrWork').track(producer.promise);
      expect(() => application.assertUpdateAllowed()).toThrow(
        'Cannot update SSR from a request being drained',
      );
      const receipt = application.defer(() =>
        application.update(async () => {
          version = 'new';
        }),
      );
      expect(receipt.accepted).toBe(true);
      completed = receipt.completed;
    }
    return c.text(c.get('templates').main);
  });
  const response = await app.request('/');
  expect(await response.text()).toBe('old');
  await tick();
  expect(version).toBe('old');
  producer.resolve();
  await expect(completed).resolves.toBe(1);
  expect(await (await app.request('/')).text()).toBe('new');
});
