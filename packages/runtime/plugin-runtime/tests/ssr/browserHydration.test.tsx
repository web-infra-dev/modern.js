import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
import React, { act, useId } from 'react';
import type { Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { ESCAPED_SHELL_STREAM_END_MARK } from '../../src/common';
import { render } from '../../src/core/browser';
import { createRoot as createPageRoot } from '../../src/core/react';
import { hydrateRoot } from '../../src/core/browser/hydrate';
import { getInitialContext } from '../../src/core/context/runtime';
import {
  ROUTER_DATA_JSON_ID,
  RenderLevel,
  SSR_DATA_JSON_ID,
} from '../../src/core/constants';
import { setGlobalContext } from '../../src/core/context';
import {
  registerRuntimeDefinition,
  createRuntime,
} from '../../src/core/plugin';
import { StreamRoot } from '../../src/core/react/streamRoot';

it('isolates bootstrap data and request objects across ordinary page mounts', async () => {
  const previousData = window._SSR_DATA;
  const previousRouterData = window._ROUTER_DATA;
  const previousReady = window._SSR_DATA_READY;
  const previousHydration = process.env.MODERN_ENABLE_HYDRATION;
  delete window._SSR_DATA_READY;
  delete window._ROUTER_DATA;
  delete process.env.MODERN_ENABLE_HYDRATION;
  const bootstrap = {
    mode: 'string' as const,
    renderLevel: RenderLevel.SERVER_RENDER,
    data: { initialData: { profile: { name: 'bootstrap' } } },
    context: {
      request: {
        headers: { 'x-source': 'bootstrap', 'set-cookie': ['original=1'] },
        params: { id: 'bootstrap' },
      },
    },
  };
  window._SSR_DATA = bootstrap as any;
  const records: Array<{
    context: ReturnType<typeof getInitialContext>;
    update: (patch: Record<string, unknown>) => void;
  }> = [];
  const Page = () => <p>Ordinary page</p>;
  setGlobalContext({ App: Page });
  registerRuntimeDefinition(context =>
    createRuntime(
      [
        {
          name: 'bootstrap-isolation',
          setup(api) {
            records.push({
              context: api.getRuntimeContext(),
              update: api.updateRuntimeContext,
            });
          },
        },
      ],
      undefined,
      context,
    ),
  );
  const PageRoot = createPageRoot();
  const containers = [
    document.createElement('div'),
    document.createElement('div'),
  ];
  document.body.append(...containers);
  const roots: Root[] = [];
  try {
    await act(async () => {
      for (const container of containers)
        roots.push(await render(<PageRoot />, container));
    });
    expect(records).toHaveLength(2);
    expect(containers.map(container => container.textContent)).toEqual([
      'Ordinary page',
      'Ordinary page',
    ]);
    records[0].update({
      initialData: { profile: { name: 'first mount' } },
      requestContext: {
        request: {
          headers: { 'x-source': 'first mount' },
          params: { id: 'first mount' },
        },
      },
    });
    records[0].context.requestContext.request.headers['set-cookie']!.push(
      'first=1',
    );
    const read = (context: (typeof records)[number]['context']) => ({
      initialData: context.initialData,
      headers: context.requestContext.request.headers,
      params: context.requestContext.request.params,
    });
    const original = {
      initialData: { profile: { name: 'bootstrap' } },
      headers: { 'x-source': 'bootstrap', 'set-cookie': ['original=1'] },
      params: { id: 'bootstrap' },
    };
    expect({
      first: read(records[0].context),
      second: read(records[1].context),
      source: {
        initialData: bootstrap.data.initialData,
        headers: bootstrap.context.request.headers,
        params: bootstrap.context.request.params,
      },
    }).toEqual({
      first: {
        initialData: { profile: { name: 'first mount' } },
        headers: {
          'x-source': 'first mount',
          'set-cookie': ['original=1', 'first=1'],
        },
        params: { id: 'first mount' },
      },
      second: original,
      source: original,
    });
  } finally {
    await act(async () => roots.forEach(root => root.unmount()));
    containers.forEach(container => container.remove());
    window._SSR_DATA = previousData;
    window._ROUTER_DATA = previousRouterData;
    window._SSR_DATA_READY = previousReady;
    if (previousHydration === undefined)
      delete process.env.MODERN_ENABLE_HYDRATION;
    else process.env.MODERN_ENABLE_HYDRATION = previousHydration;
  }
});

it.each([false, true])(
  'hydrates the existing shell after late data arrives (JSON script: %s)',
  async useJsonScript => {
    const previousHydration = process.env.MODERN_ENABLE_HYDRATION;
    process.env.MODERN_ENABLE_HYDRATION = 'true';
    delete window._SSR_DATA;
    delete window._ROUTER_DATA;
    let ready!: () => void;
    window._SSR_DATA_READY = new Promise<void>(resolve => {
      ready = resolve;
    });
    const beforeRenderData: unknown[] = [];
    setGlobalContext({ entryName: 'index' });
    registerRuntimeDefinition(context =>
      createRuntime(
        [
          {
            name: 'check-hydration-shell-context',
            setup(api) {
              api.onBeforeRender(context => {
                beforeRenderData.push(
                  context.initialData,
                  context.__i18nData__,
                  window._ROUTER_DATA,
                );
              });
            },
          },
        ],
        undefined,
        context,
      ),
    );
    function Page(_props: { basename: string }) {
      return <p id={useId()}>server shell</p>;
    }
    const element = <Page basename="/" />;
    const container = document.createElement('div');
    // Use the real server root shape, including the shell marker's sibling
    // slot. The transport removes the marker before inserting the HTML.
    container.innerHTML = renderToString(
      <StreamRoot includeMarker>{element}</StreamRoot>,
      { identifierPrefix: SSR_HYDRATION_ID_PREFIX },
    ).replace(ESCAPED_SHELL_STREAM_END_MARK, '');
    document.body.append(container);
    const original = container.firstElementChild;
    const originalId = original!.id;
    const scripts: HTMLElement[] = [];
    let root: Root | undefined;
    try {
      const pending = render(element, container);
      await Promise.resolve();
      expect(beforeRenderData).toEqual([]);
      expect(container.firstElementChild).toBe(original);
      const ssrData = {
        mode: 'stream' as const,
        renderLevel: RenderLevel.SERVER_RENDER,
        data: { initialData: { source: 'server' }, i18nData: { lng: 'zh' } },
      };
      const routerData = { loaderData: { page: 'server' }, errors: null };
      if (useJsonScript) {
        for (const [id, data] of [
          [SSR_DATA_JSON_ID, ssrData],
          [ROUTER_DATA_JSON_ID, routerData],
        ] as const) {
          const script = document.createElement('script');
          script.id = id;
          script.type = 'application/json';
          script.textContent = JSON.stringify(data);
          document.body.append(script);
          scripts.push(script);
        }
      } else {
        window._SSR_DATA = ssrData;
        window._ROUTER_DATA = routerData;
      }
      // Resolve the shell handshake while the overall response can still be
      // streaming Remote/Suspense content. No DOMContentLoaded is required.
      await act(async () => {
        ready();
        root = (await pending) as Root;
      });
      expect(beforeRenderData).toEqual([
        { source: 'server' },
        { lng: 'zh' },
        routerData,
      ]);
      expect(container.firstElementChild).toBe(original);
      expect(container.firstElementChild!.id).toBe(originalId);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
      scripts.forEach(script => script.remove());
      delete window._SSR_DATA;
      delete window._ROUTER_DATA;
      delete window._SSR_DATA_READY;
      if (previousHydration === undefined) {
        delete process.env.MODERN_ENABLE_HYDRATION;
      } else {
        process.env.MODERN_ENABLE_HYDRATION = previousHydration;
      }
    }
  },
);

it.each(['stream', 'string'] as const)(
  'preserves ordinary Modern %s SSR useId and DOM without a composition handshake',
  async mode => {
    const previousHydration = process.env.MODERN_ENABLE_HYDRATION;
    process.env.MODERN_ENABLE_HYDRATION = 'true';
    delete window._SSR_DATA_READY;
    setGlobalContext({ entryName: 'index' });
    const languages: unknown[] = [];
    registerRuntimeDefinition(context =>
      createRuntime(
        [
          {
            name: 'ordinary-page-language',
            setup(api) {
              api.onBeforeRender(context => {
                languages.push(context.__i18nData__);
                expect(context.ssr).toBe(true);
              });
            },
          },
        ],
        undefined,
        context,
      ),
    );
    function Page() {
      return <p id={useId()}>ordinary page</p>;
    }
    const element = <Page />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(
      mode === 'stream' ? (
        <StreamRoot includeMarker>{element}</StreamRoot>
      ) : (
        element
      ),
      { identifierPrefix: SSR_HYDRATION_ID_PREFIX },
    ).replace(ESCAPED_SHELL_STREAM_END_MARK, '');
    document.body.append(container);
    const original = container.firstElementChild;
    const id = original!.id;
    window._SSR_DATA = {
      mode,
      renderLevel: RenderLevel.SERVER_RENDER,
      data: { i18nData: { lng: 'en' } },
    };
    let root: Root | undefined;
    try {
      await act(async () => {
        root = (await render(element, container)) as Root;
      });
      expect(container.firstElementChild).toBe(original);
      expect(original!.id).toBe(id);
      expect(window._SSR_DATA_READY).toBeUndefined();
      expect(languages).toEqual([{ lng: 'en' }]);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
      delete window._SSR_DATA;
      delete window._ROUTER_DATA;
      if (previousHydration === undefined)
        delete process.env.MODERN_ENABLE_HYDRATION;
      else process.env.MODERN_ENABLE_HYDRATION = previousHydration;
    }
  },
);

it('keeps ordinary CSR context without SSR language or server prefetch eligibility', async () => {
  delete window._SSR_DATA;
  delete window._SSR_DATA_READY;
  setGlobalContext({ entryName: 'index' });
  const contexts: unknown[] = [];
  registerRuntimeDefinition(context =>
    createRuntime(
      [
        {
          name: 'ordinary-csr-context',
          setup(api) {
            api.onBeforeRender(context => {
              contexts.push({
                language: context.__i18nData__,
                ssr: context.ssr,
              });
            });
          },
        },
      ],
      undefined,
      context,
    ),
  );
  const container = document.createElement('div');
  document.body.append(container);
  let root: Root | undefined;
  try {
    await act(async () => {
      root = (await render(<p>client page</p>, container)) as Root;
    });
    expect(contexts).toEqual([{ language: undefined, ssr: false }]);
    expect(container.textContent).toBe('client page');
  } finally {
    await act(async () => root?.unmount());
    container.remove();
  }
});

it.each(['string', 'stream'] as const)(
  'rejects failed ordinary %s hydration and releases the instance',
  async mode => {
    const previousHydration = process.env.MODERN_ENABLE_HYDRATION;
    const previousData = window._SSR_DATA;
    const previousReady = window._SSR_DATA_READY;
    process.env.MODERN_ENABLE_HYDRATION = 'true';
    delete window._SSR_DATA_READY;
    window._SSR_DATA = { mode, renderLevel: RenderLevel.SERVER_RENDER } as any;
    const cleanup = rstest.fn();
    let canonical: ReturnType<typeof getInitialContext> | undefined;
    registerRuntimeDefinition(context =>
      createRuntime(
        [
          {
            name: 'failed-hydration-cleanup',
            setup(api) {
              canonical = api.getRuntimeContext();
              api.onDispose(cleanup);
            },
          },
        ],
        undefined,
        context,
      ),
    );
    const App = () => <p>never mounted</p>;
    setGlobalContext({ App });
    try {
      // React rejects the missing container after asynchronous instance setup.
      // String hydration must forward that rejection through loadableReady too.
      await expect(
        render(<App />, 'missing-hydration-contract-container'),
      ).rejects.toThrow('Target container');
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(canonical).not.toHaveProperty('_hydration');
    } finally {
      if (previousHydration === undefined)
        delete process.env.MODERN_ENABLE_HYDRATION;
      else process.env.MODERN_ENABLE_HYDRATION = previousHydration;
      window._SSR_DATA = previousData;
      window._SSR_DATA_READY = previousReady;
    }
  },
);

it.each(['string', 'stream'] as const)(
  'keeps %s CSR, prefetch and missing-level fallbacks free of hydration state',
  async mode => {
    const previousData = window._SSR_DATA;
    const warning = rstest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      for (const renderLevel of [RenderLevel.CLIENT_RENDER, 1, undefined]) {
        window._SSR_DATA = { mode, renderLevel } as any;
        const canonical = getInitialContext(true);
        const root = { unmount() {} } as Root;
        const renderClient = rstest.fn(async () => {
          expect(canonical).not.toHaveProperty('_hydration');
          return root;
        });
        const hydrateClient = rstest.fn(async () => root);
        expect(
          await hydrateRoot(
            <p>fallback</p>,
            canonical,
            renderClient,
            hydrateClient,
          ),
        ).toBe(root);
        expect(renderClient).toHaveBeenCalledTimes(1);
        expect(hydrateClient).not.toHaveBeenCalled();
        expect(canonical).not.toHaveProperty('_hydration');
      }
    } finally {
      window._SSR_DATA = previousData;
      warning.mockRestore();
    }
  },
);

it('uses client rendering when hydration is disabled even if SSR data is present', async () => {
  const previousHydration = process.env.MODERN_ENABLE_HYDRATION;
  const previousData = window._SSR_DATA;
  const previousReady = window._SSR_DATA_READY;
  delete process.env.MODERN_ENABLE_HYDRATION;
  delete window._SSR_DATA_READY;
  window._SSR_DATA = {
    mode: 'string',
    renderLevel: RenderLevel.SERVER_RENDER,
  } as any;
  let canonical: ReturnType<typeof getInitialContext> | undefined;
  const cleanup = rstest.fn();
  registerRuntimeDefinition(context =>
    createRuntime(
      [
        {
          name: 'disabled-hydration',
          setup(api) {
            canonical = api.getRuntimeContext();
            api.onDispose(cleanup);
          },
        },
      ],
      undefined,
      context,
    ),
  );
  const container = document.createElement('div');
  container.innerHTML = '<p>server content</p>';
  document.body.append(container);
  const serverNode = container.firstElementChild;
  let root: Root | undefined;
  try {
    await act(async () => {
      root = await render(<p>client content</p>, container);
    });
    expect(container.textContent).toBe('client content');
    expect(container.firstElementChild).not.toBe(serverNode);
    expect(canonical).not.toHaveProperty('_hydration');
  } finally {
    await act(async () => root?.unmount());
    container.remove();
    if (previousHydration === undefined)
      delete process.env.MODERN_ENABLE_HYDRATION;
    else process.env.MODERN_ENABLE_HYDRATION = previousHydration;
    window._SSR_DATA = previousData;
    window._SSR_DATA_READY = previousReady;
  }
  expect(cleanup).toHaveBeenCalledTimes(1);
});
