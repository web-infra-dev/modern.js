import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { AsyncLocalStorage } from 'node:async_hooks';
import { afterEach, expect, it, rstest } from '@rstest/core';
import {
  LOADABLE_STATS_FILE,
  ROUTE_MANIFEST_FILE,
  NESTED_ROUTE_SPEC_FILE,
} from '@modern-js/utils';
import {
  createServerBase,
  createDefaultPlugins,
  renderPlugin,
} from '../../src';
import { injectResourcePlugin } from '../../src/adapters/node/plugins/resource';
import type {
  SSRApplication,
  SSRApplicationResources,
} from '../../src/adapters/node/application';
import { getDefaultConfig, getDefaultAppContext } from '../helpers';

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map(directory => rm(directory, { recursive: true, force: true })),
  );
});
const tick = () => new Promise(resolve => setImmediate(resolve));
async function fixture(
  deferred = false,
  options: {
    gate?: (stats: unknown) => boolean;
    run?: <T>(operation: () => T) => T;
    validate?: () => void | Promise<void>;
  } = {},
) {
  const pwd = await mkdtemp(
    path.join(tmpdir(), 'modern-selective-publication-'),
  );
  directories.push(pwd);
  await mkdir(path.join(pwd, 'bundles'));
  for (const entry of ['a', 'b']) {
    await writeFile(
      path.join(pwd, `${entry}.html`),
      `<html>${entry}:old</html>`,
    );
    await writeFile(
      path.join(pwd, `${entry}.cjs`),
      `exports.requestHandler = async () => new Response('${entry}:old')`,
    );
    await writeFile(
      path.join(pwd, 'bundles', `${entry}-server-loaders.js`),
      `exports.handleRequest = async () => new Response('${entry}:loader')`,
    );
  }
  const writeManifests = async (revision: string) => {
    for (const name of [
      LOADABLE_STATS_FILE,
      ROUTE_MANIFEST_FILE,
      NESTED_ROUTE_SPEC_FILE,
    ]) {
      const filename = path.join(pwd, name);
      await mkdir(path.dirname(filename), { recursive: true });
      await writeFile(filename, JSON.stringify({ revision }));
    }
  };
  await writeManifests('old');
  const server = createServerBase({
    pwd,
    deferSSRResources: deferred,
    config: getDefaultConfig(),
    appContext: getDefaultAppContext(),
    routes: ['a', 'b'].map(entry => ({
      urlPath: `/${entry}`,
      entryName: entry,
      entryPath: `${entry}.html`,
      bundle: `${entry}.cjs`,
      isSSR: true,
    })),
  });
  let heldWork: Promise<void> | undefined;
  server.get('/b/pending', c => {
    if (heldWork) c.get('ssrWork')!.track(heldWork);
    return c.text('old b');
  });
  let application!: SSRApplication;
  let resources!: SSRApplicationResources;
  const reload = rstest.fn(async (entry: string) =>
    entry.endsWith('-server-loaders')
      ? { handleRequest: async () => new Response(`${entry}:new`) }
      : { requestHandler: async () => new Response(`${entry}:new`) },
  );
  server.addPlugins([
    ...createDefaultPlugins(),
    {
      name: 'test-publication-gate',
      setup(api) {
        api.onPrepare(() =>
          api.updateServerContext({ canPrepareSSRResources: options.gate }),
        );
      },
    },
    injectResourcePlugin({
      run: options.run,
      maxPendingRequests: 2,
      requestTimeoutMs: 1000,
      drainTimeoutMs: 1000,
      resolveScope: request => [new URL(request.url).pathname.split('/')[1]],
      reloadEntry: reload,
      onReady(owner) {
        application = owner;
      },
      async validate(candidate) {
        await options.validate?.();
        resources = candidate;
      },
    }),
    renderPlugin(),
  ]);
  await server.init();
  return {
    pwd,
    server,
    get application() {
      return application;
    },
    reload,
    writeManifests,
    holdB(work: Promise<void>) {
      heldWork = work;
    },
    get resources() {
      return resources;
    },
  };
}

it('removes a deleted optional loader only from the selected entry', async () => {
  const current = await fixture();
  const other = current.resources.serverManifest.loaderBundles!.b;
  await rm(path.join(current.pwd, 'bundles/a-server-loaders.js'));
  const invalidate = rstest.fn(async (_entries?: readonly string[]) => {});
  await current.application.update(invalidate, ['a']);
  expect(invalidate).toHaveBeenCalledWith(['a']);
  expect(current.resources.serverManifest.loaderBundles).not.toHaveProperty(
    'a',
  );
  expect(current.resources.serverManifest.loaderBundles!.b).toBe(other);
  expect(current.reload.mock.calls.map(([entry]) => entry)).toEqual(['a']);
});

it('establishes the resource owner context for both first load and subsequent resource validation', async () => {
  const context = new AsyncLocalStorage<string>();
  let validations = 0;
  const current = await fixture(false, {
    run: operation => context.run('owner', operation),
    validate: () => {
      expect(context.getStore()).toBe('owner');
      validations++;
    },
  });
  await current.server.prepareSSRResources(() => {});
  expect(validations).toBe(2);
  await current.server.close();
});

it('skips stale initial compilations and rechecks after request drain before invalidating', async () => {
  const first = {};
  const second = {};
  let latest = first;
  const current = await fixture(true, { gate: stats => stats === latest });
  const invalidate = rstest.fn();
  await current.server.prepareSSRResources(invalidate, second);
  expect(current.application).toBeUndefined();
  await current.server.prepareSSRResources(invalidate, first);
  let finish!: () => void;
  current.holdB(
    new Promise<void>(resolve => {
      finish = resolve;
    }),
  );
  await (await current.server.request('/b/pending')).text();
  const updating = current.server.prepareSSRResources(invalidate, first);
  await tick();
  latest = second;
  finish();
  await expect(updating).rejects.toThrow('superseded');
  expect(invalidate).not.toHaveBeenCalled();
  expect(current.application.status.phase).toBe('unavailable');
  await current.server.prepareSSRResources(invalidate, second);
  expect(current.application.status.phase).toBe('serving');
  expect(invalidate).toHaveBeenCalledTimes(1);
  await current.server.close();
});

it('rejects a compilation superseded during candidate validation before publishing its generation', async () => {
  const first = {};
  let latest = first;
  let supersede = false;
  const current = await fixture(true, {
    gate: stats => stats === latest,
    validate: () => {
      if (supersede) latest = {};
    },
  });
  await current.server.prepareSSRResources(() => {}, first);
  const generation = current.application.status.generation;
  supersede = true;
  await expect(
    current.server.prepareSSRResources(() => {}, first),
  ).rejects.toThrow('superseded');
  expect(current.application.status.generation).toBe(generation);
  expect(current.application.status.phase).toBe('unavailable');
  supersede = false;
  await current.server.prepareSSRResources(() => {}, latest);
  expect(current.application.status.generation).toBe(generation + 1);
  await current.server.close();
});

it('expands a queued selective update before draining when shared host manifests changed', async () => {
  const current = await fixture();
  let finish!: () => void;
  const producer = new Promise<void>(resolve => {
    finish = resolve;
  });
  current.holdB(producer);
  expect(await (await current.server.request('/b/pending')).text()).toBe(
    'old b',
  );
  await current.writeManifests('new');
  await writeFile(path.join(current.pwd, 'a.html'), '<html>a:new</html>');
  const invalidate = rstest.fn(async (_entries?: readonly string[]) => {});
  const update = current.application.update(invalidate, () => ['a']);
  await tick();
  expect(invalidate).not.toHaveBeenCalled();
  expect(current.application.status.closedScope).toBeUndefined();
  finish();
  await update;
  expect(invalidate).toHaveBeenCalledWith(undefined);
  expect(current.reload).not.toHaveBeenCalled();
  for (const name of [
    'loadableStats',
    'routeManifest',
    'nestedRoutesJson',
  ] as const) {
    expect(current.resources.serverManifest[name]).toEqual({ revision: 'new' });
  }
  expect(Object.values(current.resources.templates)).toContain(
    '<html>a:new</html>',
  );
});

it('rejects shared metadata mutation after a selective drain instead of publishing mixed resources', async () => {
  const current = await fixture();
  await expect(
    current.application.update(async () => {
      await current.writeManifests('new');
    }, ['a']),
  ).rejects.toThrow('Shared SSR manifests changed');
  expect(current.application.status.phase).toBe('unavailable');
  const invalidate = rstest.fn(async (_entries?: readonly string[]) => {});
  await current.application.update(invalidate, ['a']);
  expect(invalidate).toHaveBeenCalledWith(undefined);
  expect(current.resources.serverManifest.routeManifest).toEqual({
    revision: 'new',
  });
});

it('defers development resource loading until successful compilation and then refreshes through the owner', async () => {
  const current = await fixture(true);
  expect(current.application).toBeUndefined();
  expect(current.resources).toBeUndefined();
  let settled = false;
  const request = current.server.request('/b/pending').then(response => {
    settled = true;
    return response;
  });
  await tick();
  expect(settled).toBe(false);
  const invalidator = rstest.fn(async () => {});
  expect(await current.server.prepareSSRResources(invalidator)).toBe(true);
  expect(invalidator).not.toHaveBeenCalled();
  expect(current.application.status.phase).toBe('serving');
  expect(await (await request).text()).toBe('old b');
  const owner = current.application;
  await current.server.prepareSSRResources(invalidator);
  expect(current.application).toBe(owner);
  expect(invalidator).toHaveBeenCalledTimes(1);
  await current.server.close();
});

it('can retry resource initialization after an invalid first candidate', async () => {
  const current = await fixture(true);
  await rm(path.join(current.pwd, 'a.html'));
  await expect(current.server.prepareSSRResources(() => {})).rejects.toThrow(
    'Missing SSR template',
  );
  expect(current.application).toBeUndefined();
  await writeFile(path.join(current.pwd, 'a.html'), '<html>a:recovered</html>');
  await current.server.prepareSSRResources(() => {});
  expect(current.application.status.phase).toBe('serving');
  await current.server.close();
});
