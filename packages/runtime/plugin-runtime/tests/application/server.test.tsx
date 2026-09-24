import { storage } from '@modern-js/runtime-utils/node';
import { Await, useLoaderData } from '@modern-js/runtime-utils/router';
import React, { Suspense, useId } from 'react';
import { renderApplication } from '../../src/application/server';
import { setGlobalContext } from '../../src/core/context';
import { useRuntimeContext } from '../../src/core/context/runtime';
import { registerPlugin } from '../../src/core/plugin';
import { routerPlugin } from '../../src/router/runtime/plugin.node';

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
          <Await resolve={pending}>{value => <p>{value}</p>}</Await>
        </Suspense>
      </main>
    );
  }
  setGlobalContext({
    entryName: 'index',
    routes: [
      {
        id: 'page',
        type: 'nested',
        isRoot: true,
        path: '/',
        component: Page,
        loader,
      },
    ],
  });
  registerPlugin([
    routerPlugin(),
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
  ]);
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
