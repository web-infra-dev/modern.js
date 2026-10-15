import { storage } from '@modern-js/runtime-utils/node';
import { Await, useLoaderData } from '@modern-js/runtime-utils/router';
import type React from 'react';
import { Suspense, useId } from 'react';
import { setGlobalContext } from '../../src/core/context';
import { useRuntimeContext } from '../../src/core/context/runtime';
import { registerPlugin } from '../../src/core/plugin';
import { createRoot } from '../../src/core/react';
import { renderStream } from '../../src/mf/server';
import { routerPlugin } from '../../src/router/runtime/plugin.node';

it('renders the supplied Modern root with real request hooks and independent progressive loaders', async () => {
  const finish: Record<string, (value: string) => void> = {};
  function Page({ title }: { title?: string }) {
    const data = useLoaderData() as { label: string; pending: Promise<string> };
    const context = useRuntimeContext();
    return (
      <main id={useId()}>
        <h1>{title}</h1>
        <p>
          {data.label}:{String(context.initialData?.request)}
        </p>
        <Suspense fallback={<p>pending</p>}>
          <Await resolve={data.pending}>{value => <p>{value}</p>}</Await>
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
        loader: ({ request }: { request: Request }) => {
          const label = request.headers.get('x-request')!;
          return {
            label,
            pending: new Promise<string>(resolve => {
              finish[label] = resolve;
            }),
          };
        },
      },
    ],
  });
  registerPlugin([
    routerPlugin(),
    {
      name: 'callback-request-context',
      setup(api) {
        api.onBeforeRender(context => {
          context.initialData = {
            request: storage.useContext().headers?.['x-request'],
          };
        });
      },
    },
  ]);
  const ModernRoot = createRoot() as React.ComponentType<{ title: string }>;
  const streams = await Promise.all(
    ['a', 'b'].map(id =>
      renderStream(
        <section data-supplied-root={id}>
          <ModernRoot title={`supplied-${id}`} />
        </section>,
        {
          url: 'http://producer/',
          headers: { 'x-request': id },
          identifierPrefix: `${id}-`,
          props: { title: `transport-${id}` },
          signal: new AbortController().signal,
        },
      ),
    ),
  );
  const readers = streams.map(result => result.stream.getReader());
  for (const [index, id] of ['a', 'b'].entries()) {
    const shell = new TextDecoder().decode((await readers[index].read()).value);
    expect(shell).toContain(`data-supplied-root="${id}"`);
    expect(shell).toContain(`<h1>supplied-${id}</h1>`);
    expect(shell).not.toContain(`transport-${id}`);
    expect(shell).toContain(`${id}<!-- -->:<!-- -->${id}`);
    expect(shell).toContain(`id="${id}-shell"`);
    const initial = await streams[index].hydration!.snapshot;
    expect(initial.initialData).toEqual({ request: id });
    expect(initial.pending).toHaveLength(1);
    const updates = streams[index].hydration!.updates.getReader();
    finish[id](`resolved-${id}`);
    expect((await updates.read()).value).toMatchObject({
      status: 'fulfilled',
      value: `resolved-${id}`,
    });
    let tail = '';
    for (;;) {
      const next = await readers[index].read();
      if (next.done) break;
      tail += new TextDecoder().decode(next.value);
    }
    expect(tail).toContain(`resolved-${id}`);
    expect(
      ((await streams[index].snapshot) as any).routerData.loaderData.page
        .pending,
    ).toBe(`resolved-${id}`);
  }
});
