import {
  type LoaderFunctionArgs,
  RouterProvider,
  Outlet,
  createMemoryRouter,
  createHashRouter,
} from '@modern-js/runtime-utils/router';
import { cleanup, fireEvent, render } from '@testing-library/react';
import React, { act } from 'react';
import { renderToString } from 'react-dom/server';
import { InternalRuntimeContext } from '../../src/core/context';
import { createScopeRuntime } from '../../src/core/react/scopeDefinition';
import { createRuntime } from '../../src/core/plugin';
import { getInitialContext } from '../../src/core/context/runtime';
import { Link } from '../../src/router';

declare global {
  var __webpack_chunk_load_test__:
    ((chunkId: string | number) => Promise<void>) | undefined;
}

function application({
  prefetch,
  scope = false,
  serverLoaders = true,
  origin = 'https://producer.example',
  basename = '/mount',
  search = '',
  clientLoader = false,
  shouldRevalidate,
  hashRouter = false,
}: {
  prefetch?: 'none' | 'intent' | 'render';
  scope?: boolean;
  serverLoaders?: boolean;
  origin?: string;
  basename?: string;
  search?: string;
  clientLoader?: boolean;
  hashRouter?: boolean;
  shouldRevalidate?: (args: any) => boolean;
} = {}) {
  const routes = [
    {
      id: 'root',
      path: '/',
      element: (
        <Link to={`/detail${search}`} prefetch={prefetch}>
          Detail
        </Link>
      ),
    },
    {
      id: 'detail',
      path: '/detail',
      loader: ({ request }: LoaderFunctionArgs) => null,
      hasClientLoader: clientLoader,
      shouldRevalidate,
      element: <h1>Detail</h1>,
    },
  ];
  const loadRouteChunk = rstest.fn().mockResolvedValue(undefined);
  const manifest = {
    routeAssets: { detail: { chunkIds: [`${origin}/detail`] } },
  };
  const context = scope
    ? createScopeRuntime(
        {
          selected: true,
          routes: [],
          basename: '/standalone',
          dataRoute: '/product',
          serverLoaders,
          getDataBase: () => origin,
          getRouteManifest: () => manifest,
          loadRouteChunk,
          createRuntime: context => createRuntime([], undefined, context),
        },
        { isBrowser: true, basename, initialUrl: `${basename}/` },
      ).context
    : getInitialContext(true, manifest);
  context.routes = routes;
  // Legacy CSR also has a synthetic ssrContext, but no SSR capability marker.
  context.ssrContext = {} as any;
  if (!scope) {
    context.ssr = serverLoaders;
    context.application = {
      output: 'document',
      config: { routes: [] },
      initialUrl: window.location.href,
      basename,
      serverLoaders,
      loadRouteChunk: global.__webpack_chunk_load_test__,
    };
  }
  if (hashRouter) window.history.replaceState(null, '', `/#${basename}/`);
  const router = hashRouter
    ? createHashRouter(routes, { basename })
    : createMemoryRouter(routes, {
        basename,
        initialEntries: [`${basename}/`],
      });
  const element = (
    <InternalRuntimeContext.Provider value={context}>
      <RouterProvider router={router} />
    </InternalRuntimeContext.Provider>
  );
  return { element, router, loadRouteChunk };
}

const dataHrefs = () =>
  Array.from(document.querySelectorAll('link[rel="prefetch"][as="fetch"]')).map(
    node => node.getAttribute('href'),
  );

describe('prefetch', () => {
  beforeEach(() => {
    rstest.useFakeTimers();
    global.__webpack_chunk_load_test__ = rstest
      .fn()
      .mockResolvedValue(undefined);
    delete window._SSR_DATA;
  });
  afterEach(() => {
    cleanup();
    // React hoists resource links and retains them after unmount.
    document
      .querySelectorAll('link[rel="prefetch"]')
      .forEach(link => link.remove());
    delete window._SSR_DATA;
    rstest.useRealTimers();
  });

  for (const event of ['focus', 'mouseEnter', 'touchStart'] as const) {
    it(`supports Host intent on ${event}`, () => {
      const { element } = application({ prefetch: 'intent' });
      const { getByRole } = render(element);
      expect(dataHrefs()).toEqual([]);
      fireEvent[event](getByRole('link'));
      act(() => rstest.advanceTimersByTime(100));
      expect(global.__webpack_chunk_load_test__).toHaveBeenCalledWith(
        'https://producer.example/detail',
      );
      expect(dataHrefs()).toEqual([
        `${window.location.origin}/mount/detail?__loader=detail&__ssrDirect=true`,
      ]);
    });
  }

  it('prefetches each scoped instance from its own producer and manifest without Host SSR data', () => {
    const first = application({
      prefetch: 'render',
      scope: true,
      search: '?item=one',
    });
    const second = application({
      prefetch: 'render',
      scope: true,
      origin: 'https://second.example',
      basename: '/other',
      search: '?item=two',
    });
    render(
      <>
        {first.element}
        {second.element}
      </>,
    );
    expect(dataHrefs().sort()).toEqual([
      'https://producer.example/standalone/product/detail?item=one&__loader=detail&__ssrDirect=true',
      'https://second.example/standalone/product/detail?item=two&__loader=detail&__ssrDirect=true',
    ]);
    expect(first.loadRouteChunk).toHaveBeenCalledWith(
      'https://producer.example/detail',
    );
    expect(second.loadRouteChunk).toHaveBeenCalledWith(
      'https://second.example/detail',
    );
    expect(global.__webpack_chunk_load_test__).not.toHaveBeenCalled();
  });

  it('does not infer scoped server loaders from Host SSR data or local hydration data', () => {
    window._SSR_DATA = {} as any;
    const instance = application({
      prefetch: 'render',
      scope: true,
      serverLoaders: false,
    });
    render(instance.element);
    expect(dataHrefs()).toEqual([]);
    expect(instance.loadRouteChunk).toHaveBeenCalledTimes(1);
  });

  it('does not request server data for a client-only route', () => {
    window._SSR_DATA = {} as any;
    render(
      application({ prefetch: 'render', scope: true, clientLoader: true })
        .element,
    );
    expect(dataHrefs()).toEqual([]);
  });

  it('prefetches ordinary Host Hash Router data using the route pathname', () => {
    const instance = application({ prefetch: 'render', hashRouter: true });
    try {
      render(instance.element);
      expect(dataHrefs()).toEqual([
        `${window.location.origin}/mount/detail?__loader=detail&__ssrDirect=true`,
      ]);
    } finally {
      instance.router.dispose();
      window.history.replaceState(null, '', '/');
    }
  });

  it('does not enable Host CSR data prefetch from a synthetic SSR context', () => {
    render(application({ prefetch: 'render', serverLoaders: false }).element);
    expect(dataHrefs()).toEqual([]);
    expect(global.__webpack_chunk_load_test__).toHaveBeenCalledTimes(1);
  });

  it('passes mounted application URLs to shouldRevalidate before translating the data request', () => {
    const shouldRevalidate = rstest.fn().mockReturnValue(true);
    render(
      application({
        prefetch: 'render',
        scope: true,
        search: '?item=one#details',
        shouldRevalidate,
      }).element,
    );
    const args = shouldRevalidate.mock.calls[0][0];
    expect(args.currentUrl.href).toBe(`${window.location.origin}/mount/`);
    expect(args.nextUrl.href).toBe(
      `${window.location.origin}/mount/detail?item=one#details`,
    );
    expect(dataHrefs()).toEqual([
      'https://producer.example/standalone/product/detail?item=one&__loader=detail&__ssrDirect=true',
    ]);
  });

  it('retains current route params when prefetching a more deeply nested target', () => {
    const shouldRevalidate = rstest.fn().mockReturnValue(true);
    const routes = [
      {
        id: 'shop',
        path: '/shop/:shopId',
        element: (
          <>
            <Link to="detail/42" prefetch="render">
              Detail
            </Link>
            <Outlet />
          </>
        ),
        children: [
          {
            id: 'detail',
            path: 'detail/:id',
            loader: ({ request }: LoaderFunctionArgs) => null,
            shouldRevalidate,
            element: <h1>Detail</h1>,
          },
        ],
      },
    ];
    const context = getInitialContext(true, { routeAssets: {} });
    context.routes = routes;
    context.ssr = true;
    context.application = {
      output: 'document',
      config: { routes: [] },
      initialUrl: window.location.href,
      serverLoaders: true,
    };
    const router = createMemoryRouter(routes, {
      initialEntries: ['/shop/100'],
    });
    render(
      <InternalRuntimeContext.Provider value={context}>
        <RouterProvider router={router} />
      </InternalRuntimeContext.Provider>,
    );
    const args = shouldRevalidate.mock.calls[0][0];
    expect(args.currentParams).toEqual({ shopId: '100' });
    expect(args.nextParams).toEqual({ shopId: '100', id: '42' });
    expect(dataHrefs()).toEqual([
      `${window.location.origin}/shop/100/detail/42?__loader=detail&__ssrDirect=true`,
    ]);
  });

  it.each([undefined, 'none'] as const)(
    'does not prefetch when mode is %s',
    prefetch => {
      const { getByRole } = render(
        application({ prefetch, scope: true }).element,
      );
      fireEvent.mouseEnter(getByRole('link'));
      act(() => rstest.advanceTimersByTime(200));
      expect(dataHrefs()).toEqual([]);
      expect(global.__webpack_chunk_load_test__).not.toHaveBeenCalled();
    },
  );

  it('cancels intent before its delay', () => {
    const instance = application({ prefetch: 'intent', scope: true });
    const { getByRole } = render(instance.element);
    const link = getByRole('link');
    fireEvent.mouseEnter(link);
    fireEvent.mouseLeave(link);
    act(() => rstest.advanceTimersByTime(200));
    expect(instance.loadRouteChunk).not.toHaveBeenCalled();
    expect(dataHrefs()).toEqual([]);
  });

  it.each(['render', 'intent'] as const)(
    'does not prefetch during server rendering for %s',
    prefetch => {
      const instance = application({ prefetch, scope: true });
      expect(renderToString(instance.element)).not.toContain('rel="prefetch"');
      expect(instance.loadRouteChunk).not.toHaveBeenCalled();
    },
  );
});
