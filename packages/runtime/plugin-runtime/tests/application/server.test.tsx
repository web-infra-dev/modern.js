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
    createRuntime: routesConfig =>
      createRuntime([
        routerPlugin({}, routesConfig),
        {
          name: 'application-test-context',
          setup(api) {
            api.onBeforeRender(async context => {
              await Promise.resolve();
              context.initialData = {
                request: storage.useContext().headers?.['x-request'],
              };
              context.__i18nData__ = {
                lng: storage.useContext().headers?.['accept-language'] || 'en',
              };
            });
          },
        },
      ]),
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
    createRuntime: () =>
      createRuntime([
        {
          name: 'wait-before-render',
          setup(api) {
            api.onBeforeRender(async () => {
              entered();
              await waiting;
            });
          },
        },
      ]),
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
