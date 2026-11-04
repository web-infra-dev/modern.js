import { storage } from '@modern-js/runtime-utils/node';
import { Await, useLoaderData } from '@modern-js/runtime-utils/router';
import React, { Suspense, useId } from 'react';
import {
  renderApplication as renderScopedApplication,
  type RenderApplicationOptions,
} from '../../src/application/server';
import type { ScopedRootDefinition } from '../../src/core/react/scopeDefinition';
import { APPLICATION_PROGRESSIVE_SNAPSHOT_PROTOCOL } from '../../src/application/constants';
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
            });
          },
        },
      ]),
  };
};

it('streams the real router and deferred loader before the JSON snapshot completes', async () => {
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
  let completed = false;
  void rendered.snapshot.then(() => {
    completed = true;
  });
  await Promise.resolve();
  expect(completed).toBe(false);
  finish('resolved-stock');
  let tail = '';
  for (;;) {
    const next = await reader.read();
    if (next.done) break;
    tail += new TextDecoder().decode(next.value);
  }
  expect(tail).toContain('resolved-stock');
  const snapshot = await rendered.snapshot;
  expect(snapshot.routerData?.loaderData.page).toEqual({
    label: 'product-list',
    pending: 'resolved-stock',
  });
  expect(snapshot.initialData).toEqual({ request: 'one' });
  expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
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
        new Request('http://products/', { headers: { 'x-request': id } }),
        {
          identifierPrefix: `${id}-`,
        },
      );
      const html = await new Response(rendered.stream).text();
      return { html, snapshot: await rendered.snapshot };
    }),
  );
  expect(results[0].html).toContain('result-a');
  expect(results[0].html).not.toContain('result-b');
  expect(results[1].html).toContain('result-b');
  expect(results.map(result => result.snapshot.initialData?.request)).toEqual([
    'a',
    'b',
  ]);
});

it('aborts the render and rejects its snapshot when the consumer cancels', async () => {
  install(() => ({ label: 'abort', pending: new Promise(() => {}) }));
  const rendered = await renderApplication(new Request('http://products/'), {
    identifierPrefix: 'abort-',
  });
  const reader = rendered.stream.getReader();
  await reader.read();
  rendered.cancel(new Error('consumer disconnected'));
  await expect(rendered.snapshot).rejects.toThrow('consumer disconnected');
  await expect(reader.read()).rejects.toThrow('consumer disconnected');
});

it('publishes the complete shell and initial loader snapshot before deferred values settle', async () => {
  let finish!: (value: string) => void;
  const pending = new Promise<string>(resolve => {
    finish = resolve;
  });
  install(() => ({ label: 'early-products', pending }));
  const rendered = await renderApplication(new Request('http://products/'), {
    identifierPrefix: 'early-',
    progressiveHydration: true,
  });
  const reader = rendered.stream.getReader();
  const shell = new TextDecoder().decode((await reader.read()).value);
  const snapshot = await rendered.hydration!.snapshot;
  expect(shell).toContain('early-products');
  expect(shell).toContain('loading-details');
  expect(shell).toContain('<template id="early-shell"></template>');
  expect(rendered.hydration!.shellMarker).toBe('early-shell');
  expect(snapshot.protocol).toBe(APPLICATION_PROGRESSIVE_SNAPSHOT_PROTOCOL);
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
  expect((await rendered.snapshot).routerData?.loaderData.page.pending).toBe(
    'later-stock',
  );
});

it('transports a rejected deferred value without failing its Await error boundary', async () => {
  let reject!: (error: Error) => void;
  const pending = new Promise<string>((_, no) => {
    reject = no;
  });
  install(() => ({ label: 'products', pending }));
  const rendered = await renderApplication(new Request('http://products/'), {
    identifierPrefix: 'rejected-',
    progressiveHydration: true,
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
  await expect(rendered.snapshot).rejects.toThrow('statistics failed');
});

it('errors the progressive data channel when rendering is cancelled after the shell', async () => {
  install(() => ({ label: 'abort', pending: new Promise(() => {}) }));
  const rendered = await renderApplication(new Request('http://products/'), {
    identifierPrefix: 'abort-early-',
    progressiveHydration: true,
  });
  const reader = rendered.stream.getReader();
  await reader.read();
  const updates = rendered.hydration!.updates.getReader();
  const initial = await rendered.hydration!.snapshot;
  expect(initial.pending).toHaveLength(1);
  rendered.cancel(new Error('request disconnected'));
  await expect(updates.read()).rejects.toThrow('request disconnected');
  await expect(reader.read()).rejects.toThrow('request disconnected');
  await expect(rendered.snapshot).rejects.toThrow('request disconnected');
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
