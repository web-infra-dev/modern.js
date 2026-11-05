import { createApplicationInstance } from '../../src/core/application/instance';
import {
  createPluginContract,
  contractGate,
  preparationEvents,
  disposalEvents,
} from './pluginContract';
import { setGlobalContext } from '../../src/core/context';
import { registerRuntimeDefinition } from '../../src/core/plugin';
import { createRequestHandler } from '../../src/core/server/requestHandler';
import { CHUNK_CSS_PLACEHOLDER } from '../../src/core/server/constants';
import { wrapRuntimeContextProvider } from '../../src/core/react/wrapper';
import { renderToString } from 'react-dom/server';
import { once } from 'node:events';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { storage } from '@modern-js/runtime-utils/node';
import { Await, useLoaderData } from '@modern-js/runtime-utils/router';
import React, { Suspense, useId } from 'react';
import {
  renderApplication as renderScopedApplication,
  type RenderApplicationOptions,
} from '../../src/application/server';
import type { ScopedRootDefinition } from '../../src/core/react/scopeDefinition';
import { APPLICATION_SNAPSHOT_PROTOCOL } from '../../src/application/constants';
import { restoreApplicationData } from '../../src/application/data';
import { useRuntimeContext } from '../../src/core/context/runtime';
import { createRuntime } from '../../src/core/plugin';
import { routerPlugin } from '../../src/router/runtime/plugin.node';

let definition: ScopedRootDefinition;
const renderApplication = (
  request: Request,
  options: Omit<RenderApplicationOptions, 'definition'>,
) => renderScopedApplication(request, { ...options, definition });

const install = (loader: (args: { request: Request }) => unknown) => {
  function Page({ title }: { title?: string }) {
    const id = useId();
    const { label, pending } = useLoaderData() as {
      label: string;
      pending: Promise<string>;
    };
    const context = useRuntimeContext();
    return (
      <main id={id}>
        <h1>{title}</h1>
        <p>
          {label}:{String(context.initialData?.request)}
        </p>
        <Suspense fallback={<p>loading-details</p>}>
          <Await resolve={pending} errorElement={<p>loader-error</p>}>
            {value => <p>{value}</p>}
          </Await>
        </Suspense>
      </main>
    );
  }
  const routes = [
    {
      id: 'page',
      type: 'nested',
      isRoot: true,
      path: '/',
      component: Page,
      loader,
    },
  ];
  definition = {
    routes: routes as any,
    selected: false,
    basename: '/',
    serverLoaders: false,
    getDataBase: () => 'http://products',
    createRuntime: context =>
      createRuntime(
        [
          routerPlugin({}),
          {
            name: 'application-test-context',
            setup(api) {
              api.onBeforeRender(async context => {
                await Promise.resolve();
                context.initialData = {
                  request: storage.useContext().headers?.['x-request'],
                };
                context.__i18nData__ = {
                  lng:
                    storage.useContext().headers?.['accept-language'] || 'en',
                };
              });
            },
          },
        ],
        undefined,
        context,
      ),
  };
};

it('streams the real router and restores deferred loader data from the initial snapshot', async () => {
  let finish!: (value: string) => void;
  const pending = new Promise<string>(resolve => {
    finish = resolve;
  });
  install(() => ({ label: 'product-list', pending }));
  const rendered = await renderApplication(
    new Request('http://products/', { headers: { 'x-request': 'one' } }),
    {
      identifierPrefix: 'product-one-',
      props: { title: 'Products' },
      nonce: 'demo-nonce',
    },
  );
  const reader = rendered.stream.getReader();
  const first = new TextDecoder().decode((await reader.read()).value);
  expect(first).toContain('product-list');
  expect(first).toContain('Products');
  expect(first).toContain('loading-details');
  expect(first).toContain('product-one-');
  expect(first).not.toContain('_ROUTER_DATA');
  const snapshot = await rendered.hydration.snapshot;
  expect(snapshot.routerData?.loaderData.page.pending).toBeNull();
  expect(snapshot.initialData).toEqual({ request: 'one' });
  expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
  const restored = restoreApplicationData(snapshot, rendered.hydration.updates);
  const loader = restored.snapshot.routerData!.loaderData.page;
  expect(loader.pending).toBeInstanceOf(Promise);
  finish('resolved-stock');
  let tail = '';
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    tail += new TextDecoder().decode(next.value);
  }
  expect(tail).toContain('resolved-stock');
  expect(loader.label).toBe('product-list');
  expect(await loader.pending).toBe('resolved-stock');
  await restored.done;
  expect(rendered).not.toHaveProperty('snapshot');
  expect(snapshot.i18nData).toEqual({ lng: 'en' });
});

it('isolates concurrent request headers, prefixes, and loader results', async () => {
  install(async ({ request }) => {
    await Promise.resolve();
    const label = request.headers.get('x-request')!;
    return { label, pending: Promise.resolve(`result-${label}`) };
  });
  const results = await Promise.all(
    ['a', 'b'].map(async id => {
      const rendered = await renderApplication(
        new Request('http://products/', {
          headers: {
            'x-request': id,
            'accept-language': id === 'a' ? 'en' : 'zh',
          },
        }),
        {
          identifierPrefix: `${id}-`,
        },
      );
      const html = await new Response(rendered.stream).text();
      const restored = restoreApplicationData(
        await rendered.hydration.snapshot,
        rendered.hydration.updates,
      );
      await restored.done;
      return { html, snapshot: restored.snapshot };
    }),
  );
  expect(results[0].html).toContain('result-a');
  expect(results[0].html).not.toContain('result-b');
  expect(results[1].html).toContain('result-b');
  expect(results.map(result => result.snapshot.initialData?.request)).toEqual([
    'a',
    'b',
  ]);
  expect(results.map(result => result.snapshot.i18nData)).toEqual([
    { lng: 'en' },
    { lng: 'zh' },
  ]);
});

it('aborts HTML and deferred data when the consumer cancels', async () => {
  install(() => ({ label: 'abort', pending: new Promise(() => {}) }));
  const rendered = await renderApplication(new Request('http://products/'), {
    identifierPrefix: 'abort-',
  });
  const reader = rendered.stream.getReader();
  await reader.read();
  const updates = rendered.hydration.updates.getReader();
  rendered.cancel(new Error('consumer disconnected'));
  await expect(updates.read()).rejects.toThrow('consumer disconnected');
  await expect(reader.read()).rejects.toThrow('consumer disconnected');
});

it('cancels a real deferred loader fetch after the initial shell has returned', async () => {
  let connected!: () => void;
  const started = new Promise<void>(resolve => {
    connected = resolve;
  });
  let disconnected!: () => void;
  const closed = new Promise<boolean>(resolve => {
    disconnected = () => resolve(true);
  });
  const server = createServer((_request, response) => {
    response.write('pending detail');
    response.once('close', () => {
      if (!response.writableFinished) disconnected();
    });
    connected();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const controller = new AbortController();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    install(({ request }) => ({
      label: 'deferred network request',
      pending: fetch(endpoint, { signal: request.signal }).then(response =>
        response.text(),
      ),
    }));
    const rendered = await renderApplication(new Request('http://products/'), {
      identifierPrefix: 'cancel-deferred-fetch-',
      signal: controller.signal,
    });
    reader = rendered.stream.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toContain(
      'loading-details',
    );
    await started;
    controller.abort(new Error('consumer disconnected after shell'));
    await expect(reader.read()).rejects.toThrow(
      'consumer disconnected after shell',
    );
    expect(
      await Promise.race([
        closed,
        new Promise<boolean>(resolve => {
          timeout = setTimeout(() => resolve(false), 1000);
        }),
      ]),
    ).toBe(true);
  } finally {
    clearTimeout(timeout);
    controller.abort();
    await reader?.cancel().catch(() => {});
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve())),
    );
  }
});

it('publishes the complete shell and initial loader snapshot before deferred values settle', async () => {
  let finish!: (value: string) => void;
  const pending = new Promise<string>(resolve => {
    finish = resolve;
  });
  install(() => ({ label: 'early-products', pending }));
  const rendered = await renderApplication(new Request('http://products/'), {
    identifierPrefix: 'early-',
  });
  const reader = rendered.stream.getReader();
  const shell = new TextDecoder().decode((await reader.read()).value);
  const snapshot = await rendered.hydration!.snapshot;
  expect(shell).toContain('early-products');
  expect(shell).toContain('loading-details');
  expect(shell).toContain('<template id="early-shell"></template>');
  expect(rendered.hydration!.shellMarker).toBe('early-shell');
  expect(snapshot.protocol).toBe(APPLICATION_SNAPSHOT_PROTOCOL);
  expect(snapshot.i18nData).toEqual({ lng: 'en' });
  expect(snapshot.routerData?.loaderData.page).toEqual({
    label: 'early-products',
    pending: null,
  });
  expect(snapshot.pending).toEqual([
    { id: '0', path: ['routerData', 'loaderData', 'page', 'pending'] },
  ]);
  const updates = rendered.hydration!.updates.getReader();
  finish('later-stock');
  expect((await updates.read()).value).toEqual({
    id: '0',
    status: 'fulfilled',
    value: 'later-stock',
    pending: [],
  });
  expect((await updates.read()).done).toBe(true);
  let tail = '';
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    tail += new TextDecoder().decode(next.value);
  }
  expect(tail).toContain('later-stock');
  expect(rendered).not.toHaveProperty('snapshot');
});

it('transports a rejected deferred value without failing its Await error boundary', async () => {
  let reject!: (error: Error) => void;
  const pending = new Promise<string>((_, no) => {
    reject = no;
  });
  install(() => ({ label: 'products', pending }));
  const rendered = await renderApplication(new Request('http://products/'), {
    identifierPrefix: 'rejected-',
  });
  const html = new Response(rendered.stream).text();
  const updates = rendered.hydration!.updates.getReader();
  reject(new Error('statistics failed'));
  expect((await updates.read()).value).toMatchObject({
    id: '0',
    status: 'rejected',
    error: { message: 'statistics failed' },
  });
  expect((await updates.read()).done).toBe(true);
  expect(await html).toContain('loader-error');
});

it('errors the progressive data channel when rendering is cancelled after the shell', async () => {
  install(() => ({ label: 'abort', pending: new Promise(() => {}) }));
  const rendered = await renderApplication(new Request('http://products/'), {
    identifierPrefix: 'abort-early-',
  });
  const reader = rendered.stream.getReader();
  await reader.read();
  const updates = rendered.hydration!.updates.getReader();
  const initial = await rendered.hydration!.snapshot;
  expect(initial.pending).toHaveLength(1);
  rendered.cancel(new Error('request disconnected'));
  await expect(updates.read()).rejects.toThrow('request disconnected');
  await expect(reader.read()).rejects.toThrow('request disconnected');
});

it('serializes the initial snapshot once without computing a final snapshot after HTML ends', async () => {
  install(() => ({ label: 'once', pending: Promise.resolve('stock') }));
  let serializations = 0;
  const rendered = await renderApplication(new Request('http://products/'), {
    identifierPrefix: 'once-',
    props: {
      marker: {
        toJSON() {
          serializations++;
          return 'captured';
        },
      },
    },
  });
  const snapshot = await rendered.hydration.snapshot;
  expect(snapshot.props.marker).toBe('captured');
  const restored = restoreApplicationData(snapshot, rendered.hydration.updates);
  await new Response(rendered.stream).text();
  await restored.done;
  expect(serializations).toBe(1);
  expect(rendered).not.toHaveProperty('snapshot');
});

it('cancels before a request hook completes and does not start a late React render', async () => {
  let entered!: () => void;
  let resume!: () => void;
  const started = new Promise<void>(resolve => {
    entered = resolve;
  });
  const waiting = new Promise<void>(resolve => {
    resume = resolve;
  });
  let renders = 0;
  definition = {
    routes: [],
    App: () => {
      renders++;
      return <p>late render</p>;
    },
    selected: false,
    basename: '/',
    serverLoaders: false,
    getDataBase: () => 'http://products',
    createRuntime: context =>
      createRuntime(
        [
          {
            name: 'wait-before-render',
            setup(api) {
              api.onBeforeRender(async () => {
                entered();
                await waiting;
              });
            },
          },
        ],
        undefined,
        context,
      ),
  };
  const controller = new AbortController();
  const pending = renderApplication(new Request('http://products/'), {
    identifierPrefix: 'cancel-init-',
    signal: controller.signal,
  });
  const cancelled = expect(pending).rejects.toThrow('request disconnected');
  await started;
  controller.abort(new Error('request disconnected'));
  await cancelled;
  resume();
  await new Promise(resolve => setTimeout(resolve, 10));
  expect(renders).toBe(0);
});

it('passes an explicit cancellation signal through to the running loader', async () => {
  let entered!: () => void;
  const started = new Promise<void>(resolve => {
    entered = resolve;
  });
  let loaderAborted = false;
  install(
    ({ request }) =>
      new Promise((_, reject) => {
        request.signal.addEventListener('abort', () => {
          loaderAborted = true;
          reject(request.signal.reason);
        });
        entered();
      }),
  );
  const controller = new AbortController();
  const pending = renderApplication(new Request('http://products/'), {
    identifierPrefix: 'cancel-loader-',
    signal: controller.signal,
  });
  const cancelled = expect(pending).rejects.toThrow('loader cancelled');
  await started;
  controller.abort(new Error('loader cancelled'));
  await cancelled;
  expect(loaderAborted).toBe(true);
});

function contractRequestOptions() {
  const noop = () => {};
  return {
    resource: {
      entryName: 'index',
      route: { entryName: 'index', urlPath: '/', isSSR: true },
      routeManifest: { routeAssets: {} },
      loadableStats: {},
      htmlTemplate: '<html><head></head><body></body></html>',
    },
    config: { ssr: { mode: 'string' } },
    params: {},
    loaderContext: new Map(),
    monitors: {
      error: noop,
      warn: noop,
      info: noop,
      debug: noop,
      trace: noop,
      push: noop,
      timing: noop,
      counter: noop,
    },
    onError: noop,
    onTiming: noop,
  } as any;
}
async function renderContract(
  kind: 'page' | 'Bridge',
  probe: ReturnType<typeof createPluginContract>,
  request: Request,
) {
  const create = (context: any) =>
    createRuntime(probe.plugins, undefined, context);
  if (kind === 'Bridge') {
    const result = await renderScopedApplication(request, {
      identifierPrefix: 'contract-',
      definition: {
        App: probe.Page,
        routes: [],
        basename: '/',
        selected: false,
        serverLoaders: false,
        getDataBase: () => 'http://producer',
        createRuntime: create,
      },
    });
    return new Response(result.stream);
  }
  setGlobalContext({ App: probe.Page });
  registerRuntimeDefinition(create);
  const handler = await createRequestHandler(
    async (_, Root, options) =>
      new Response(
        renderToString(
          wrapRuntimeContextProvider(<Root />, options.runtimeContext),
        ),
      ),
  );
  return handler(request, contractRequestOptions());
}

it.each(['page', 'Bridge'] as const)(
  '%s executes the same plugin contract with request-local context and releases after the response',
  async kind => {
    const gate = contractGate();
    const probe = createPluginContract({
      expectedSSR: true,
      setupGate: gate.promise,
    });
    const request = new Request('http://producer/contract');
    const pending = renderContract(kind, probe, request);
    await expect.poll(() => probe.records.length).toBe(1);
    expect(probe.records[0].events).toEqual(['setup:source']);
    gate.release();
    const response = await pending;
    const html = await response.text();
    const record = probe.records[0];
    expect(record.provider).toBe(record.context);
    expect(record.publicData).toBe(record.context.contract);
    expect(record.context.ssrContext?.request.raw).toBe(request);
    expect(html).toContain('data-contract-wrapper');
    expect(html).toContain('contract:ready:http://producer/contract');
    expect(record.events).toEqual([...preparationEvents, ...disposalEvents]);
  },
);

it.each(['page', 'Bridge'] as const)(
  '%s keeps concurrent plugin instances and provider data separate',
  async kind => {
    const probe = createPluginContract({ expectedSSR: true });
    const responses = await Promise.all(
      ['one', 'two'].map(value =>
        renderContract(kind, probe, new Request(`http://producer/${value}`)),
      ),
    );
    const bodies = await Promise.all(
      responses.map(response => response.text()),
    );
    expect(bodies[0]).toContain('contract:ready:http://producer/one');
    expect(bodies[1]).toContain('contract:ready:http://producer/two');
    expect(probe.records).toHaveLength(2);
    const [first, second] = probe.records;
    expect(first.context).not.toBe(second.context);
    expect(first.context.contract).not.toBe(second.context.contract);
    expect(first.context._internalContext).not.toBe(
      second.context._internalContext,
    );
    for (const record of probe.records)
      expect(record.events).toEqual([...preparationEvents, ...disposalEvents]);
  },
);

it.each(['page', 'Bridge'] as const)(
  '%s propagates Response interruption and plugin errors without rendering',
  async kind => {
    const stopped = new Response('contract interrupted', { status: 409 });
    const probe = createPluginContract({
      expectedSSR: true,
      interrupt: stopped,
    });
    if (kind === 'page') {
      const response = await renderContract(
        kind,
        probe,
        new Request('http://producer/'),
      );
      expect(response.status).toBe(409);
      expect(await response.text()).toBe('contract interrupted');
    } else {
      await expect(
        renderContract(kind, probe, new Request('http://producer/')),
      ).rejects.toBeInstanceOf(Response);
    }
    expect(probe.records[0].provider).toBeUndefined();
    expect(probe.records[0].events).toEqual([
      ...preparationEvents.slice(0, 5),
      ...disposalEvents,
    ]);
    const error = new Error('prepare failed');
    const failed = createPluginContract({ expectedSSR: true, error });
    await expect(
      renderContract(kind, failed, new Request('http://producer/')),
    ).rejects.toBe(error);
    expect(failed.records[0].events).toEqual([
      ...preparationEvents.slice(0, 5),
      ...disposalEvents,
    ]);
  },
);

it.each([
  ['page', 'setup'],
  ['Bridge', 'setup'],
  ['page', 'hook'],
  ['Bridge', 'hook'],
] as const)(
  '%s immediately cancels pending %s without waiting for plugin code to settle',
  async (kind, phase) => {
    const gate = contractGate();
    const probe = createPluginContract({
      expectedSSR: true,
      ...(phase === 'setup'
        ? { setupGate: gate.promise }
        : { hookGate: gate.promise }),
    });
    const controller = new AbortController();
    const error = new Error('contract request aborted');
    const pending = renderContract(
      kind,
      probe,
      new Request('http://producer/', { signal: controller.signal }),
    );
    let outcome: 'pending' | 'fulfilled' | 'rejected' = 'pending';
    let reason: unknown;
    const settled = pending.then(
      () => {
        outcome = 'fulfilled';
      },
      value => {
        outcome = 'rejected';
        reason = value;
      },
    );
    try {
      await expect
        .poll(() =>
          probe.records[0]?.events.includes(
            phase === 'setup' ? 'setup:source' : 'before:source',
          ),
        )
        .toBe(true);
      controller.abort(error);
      // The user's setup/hook remains pending until after this assertion.
      await expect.poll(() => outcome, { timeout: 1000 }).toBe('rejected');
      expect(reason).toBe(error);
      expect(probe.records[0].provider).toBeUndefined();
      expect(probe.records[0].events).toEqual(
        phase === 'setup'
          ? ['setup:source', 'dispose:source']
          : [...preparationEvents.slice(0, 5), ...disposalEvents],
      );
    } finally {
      gate.release();
      await settled;
    }
    await new Promise(resolve => setTimeout(resolve, 0));
    const events = probe.records[0].events;
    expect(events).not.toContain('before:consumer');
    expect(events).not.toContain('wrap:consumer');
    if (phase === 'setup') {
      expect(events).not.toContain('setup:consumer');
      expect(events).not.toContain('config');
      expect(events).not.toContain('before:source');
    }
    expect(events.filter(event => event === 'dispose:source')).toHaveLength(1);
  },
);

it.each(['page', 'Bridge'] as const)(
  '%s preserves response headers across redirect and non-redirect plugin interruptions',
  async kind => {
    for (const status of [302, 409]) {
      const body = `stopped-${status}`;
      const statusText =
        status === 302 ? 'Contract Redirect' : 'Contract Conflict';
      const stopped = new Response(body, {
        status,
        statusText,
        headers: {
          Location: '/next',
          'X-Contract': String(status),
          'Set-Cookie': 'language=zh; Path=/',
        },
      });
      const probe = createPluginContract({
        expectedSSR: true,
        interrupt: stopped,
      });
      let response: Response;
      if (kind === 'page')
        response = await renderContract(
          kind,
          probe,
          new Request('http://producer/'),
        );
      else {
        const outcome = await renderContract(
          kind,
          probe,
          new Request('http://producer/'),
        ).then(
          () => {
            throw new Error('Bridge must interrupt');
          },
          error => error,
        );
        expect(outcome).toBeInstanceOf(Response);
        response = outcome;
      }
      expect(response.status).toBe(status);
      expect(response.statusText).toBe(statusText);
      expect(response.headers.get('Location')).toBe('/next');
      expect(response.headers.get('X-Contract')).toBe(String(status));
      expect(response.headers.get('Set-Cookie')).toBe('language=zh; Path=/');
      expect(await response.text()).toBe(body);
      expect(probe.records[0].events).toEqual([
        ...preparationEvents.slice(0, 5),
        ...disposalEvents,
      ]);
    }
  },
);

it('reports abort cleanup failures without throwing out of the AbortSignal listener', async () => {
  const controller = new AbortController();
  const errors: unknown[] = [];
  const cleanups: string[] = [];
  const cleanupError = new Error('plugin abort cleanup failed');
  const instance = createApplicationInstance(
    {
      App: () => null,
      createRuntime: context =>
        createRuntime(
          [
            {
              name: 'abort-cleanup',
              setup(api) {
                api.onDispose(() => cleanups.push('remaining'));
                api.onDispose(() => {
                  cleanups.push('failing');
                  throw cleanupError;
                });
              },
            },
          ],
          undefined,
          context,
        ),
    },
    {
      isBrowser: false,
      output: 'document',
      initialUrl: 'http://producer/',
      signal: controller.signal,
      onError: error => errors.push(error),
    },
  );
  await instance.prepare();
  expect(() => controller.abort(new Error('disconnected'))).not.toThrow();
  // An uncaught EventTarget listener failure is surfaced on the next tick.
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(cleanups).toEqual(['failing', 'remaining']);
  expect(errors).toHaveLength(1);
  expect(errors[0]).toBeInstanceOf(AggregateError);
  expect(instance.runtime.disposed).toBe(true);
  expect(() => instance.dispose()).not.toThrow();
  expect(errors).toHaveLength(1);
});

it('captures each ordinary request handler definition before another application registers', async () => {
  const makeHandler = async (label: string) => {
    function Page() {
      return <p>{`${label}:${String(useRuntimeContext().owner)}`}</p>;
    }
    setGlobalContext({ entryName: label, App: Page });
    registerRuntimeDefinition(context =>
      createRuntime(
        [
          {
            name: 'owner',
            setup(api) {
              api.updateRuntimeContext({ owner: label });
            },
          },
        ],
        undefined,
        context,
      ),
    );
    return createRequestHandler(
      async (_, Root, options) =>
        new Response(
          renderToString(
            wrapRuntimeContextProvider(<Root />, options.runtimeContext),
          ),
        ),
    );
  };
  const first = await makeHandler('first');
  const second = await makeHandler('second');
  const responses = await Promise.all(
    [first, second].map(handler =>
      handler(new Request('http://producer/'), contractRequestOptions()),
    ),
  );
  expect(await responses[0].text()).toContain('first:first');
  expect(await responses[1].text()).toContain('second:second');
});

it('keeps shared resource templates unchanged across concurrent ordinary requests', async () => {
  const gate = contractGate();
  const seen: Array<{ resource: object; template: string }> = [];
  setGlobalContext({ App: () => <p>template owner</p> });
  registerRuntimeDefinition(context => createRuntime([], undefined, context));
  const handler = await createRequestHandler(async (_, _Root, options) => {
    seen.push({
      resource: options.resource,
      template: options.resource.htmlTemplate,
    });
    await gate.promise;
    return new Response(options.resource.htmlTemplate);
  });
  const options = contractRequestOptions();
  const original = options.resource.htmlTemplate;
  Object.freeze(options.resource);
  const requests = ['one', 'two'].map(label =>
    handler(new Request(`http://producer/${label}`), options),
  );
  try {
    await expect.poll(() => seen.length).toBe(2);
    expect(options.resource.htmlTemplate).toBe(original);
    expect(seen[0].resource).not.toBe(options.resource);
    expect(seen[1].resource).not.toBe(options.resource);
    expect(seen[0].resource).not.toBe(seen[1].resource);
    for (const { template } of seen) {
      expect(template.split(CHUNK_CSS_PLACEHOLDER)).toHaveLength(2);
    }
  } finally {
    gate.release();
    const responses = await Promise.all(requests);
    await Promise.all(responses.map(response => response.text()));
  }
  expect(options.resource.htmlTemplate).toBe(original);
});

it.each(['page', 'Bridge'] as const)(
  '%s preserves preparation and cleanup errors while completing all cleanup',
  async kind => {
    const error = new Error('before-render failed');
    const cleanupError = new Error('cleanup also failed');
    const probe = createPluginContract({
      expectedSSR: true,
      error,
      cleanupError,
    });
    const failure = await renderContract(
      kind,
      probe,
      new Request('http://producer/'),
    ).then(
      () => undefined,
      value => value,
    );
    expect(failure).toBeInstanceOf(AggregateError);
    const causes = (value: unknown): unknown[] =>
      value instanceof AggregateError ? value.errors.flatMap(causes) : [value];
    expect(causes(failure)).toEqual([error, cleanupError]);
    expect(probe.records[0].provider).toBeUndefined();
    expect(probe.records[0].events).toEqual([
      ...preparationEvents.slice(0, 5),
      ...disposalEvents,
    ]);
  },
);
