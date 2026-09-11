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
