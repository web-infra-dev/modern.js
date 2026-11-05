import { getApplicationRoutes } from '../../src/router/runtime/application';
import type { NestedRoute } from '@modern-js/types';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createApplicationInstance } from '../../src/core/application/instance';
import { createRuntime } from '../../src/core/plugin';
import {
  createScopeRuntime,
  ScopedRootPropsContext,
  type ScopedRootDefinition,
} from '../../src/core/react/scopeDefinition';
import type { LoaderFunction } from '../../src/router/runtime/types';

function definition(): ScopedRootDefinition {
  const Child = Object.assign(() => <p>child</p>, {
    displayName: 'Loadable',
    preload: () => Promise.resolve(),
  });
  return {
    basename: '/shop',
    dataRoute: '/product',
    serverLoaders: true,
    getDataBase: () => 'http://producer',
    createRuntime: (context, instancePlugins) =>
      createRuntime([], undefined, context, instancePlugins),
    routes: [
      {
        id: 'root',
        type: 'nested',
        origin: 'file-system',
        isRoot: true,
        path: '/',
        component: ({ label }: { label?: string }) => <p>{label}</p>,
        error: () => <p>error</p>,
        loader: ({ request }: { request: Request }) => request.url,
        children: [
          {
            id: 'child',
            type: 'nested',
            origin: 'file-system',
            path: 'detail/:id',
            component: Child,
          },
        ],
      },
    ],
  };
}

it('isolates the route graph while keeping document components unchanged and adapting fragment props', () => {
  const application = definition();
  const document = createApplicationInstance(application, {
    isBrowser: false,
    output: 'document',
    initialUrl: 'http://producer/shop/product/',
  });
  const fragment = createScopeRuntime(application, {
    isBrowser: false,
    initialUrl: 'http://host/inventory/',
    basename: '/inventory',
    observeRouteCommits: true,
  });
  expect(document.context.application!.config).toBeUndefined();
  getApplicationRoutes(document.context);
  void fragment.runtime;
  getApplicationRoutes(fragment.context);
  const original = application.routes[0] as NestedRoute;
  const page = document.context.application!.config.routes![0] as NestedRoute;
  const embedded = fragment.context.application!.config
    .routes![0] as NestedRoute;

  expect(page).not.toBe(original);
  expect(page.component).toBe(original.component);
  expect(page.children).not.toBe(original.children);
  expect(page.children![0]).not.toBe(original.children![0]);
  expect(embedded.children![0]).not.toBe(page.children![0]);
  embedded.children![0].path = 'changed';
  expect(page.children![0].path).toBe('detail/:id');
  expect(original.children![0].path).toBe('detail/:id');

  const Layout = embedded.component as React.ComponentType<any>;
  expect(
    renderToString(
      <ScopedRootPropsContext.Provider value={{ label: 'consumer' }}>
        <Layout label="route" />
      </ScopedRootPropsContext.Provider>,
    ),
  ).toBe('<p>consumer</p>');
  const child = embedded.children![0].component as typeof original.component & {
    displayName: string;
    preload: () => Promise<void>;
  };
  expect(child.displayName).toBe('Loadable');
  expect(child.preload).toBe((original.children![0].component as any).preload);
  expect(fragment.routeCommits?.routes).toEqual(new Set(['root', 'child']));
  expect(fragment.routeCommits?.errors).toEqual(new Set(['root']));
  const another = createScopeRuntime(application, {
    isBrowser: false,
    initialUrl: 'http://host/another/',
    observeRouteCommits: true,
  });
  expect(fragment.definition).toBe(application);
  expect(another.definition).toBe(application);
  const anotherRoute = getApplicationRoutes(another.context)
    .routes![0] as NestedRoute;
  expect(anotherRoute).not.toBe(embedded);
  expect(anotherRoute.component).toBe(embedded.component);
  expect(anotherRoute.children![0].path).toBe('detail/:id');
  another.dispose();
  fragment.dispose();
  document.dispose();
});

it('translates fragment browser data requests without changing document or server loaders', async () => {
  const application = definition();
  const options = {
    initialUrl: 'http://host/inventory/detail/42',
    basename: '/inventory',
  };
  const document = createApplicationInstance(application, {
    ...options,
    isBrowser: true,
    output: 'document',
  });
  const browser = createScopeRuntime(application, {
    ...options,
    isBrowser: true,
  });
  const server = createScopeRuntime(application, {
    ...options,
    isBrowser: false,
  });
  const args = {
    request: new Request('http://host/inventory/detail/42?language=de'),
    params: {},
  };
  const routeLoader = (instance: typeof document) => {
    void instance.runtime;
    return (getApplicationRoutes(instance.context).routes![0] as NestedRoute)
      .loader as LoaderFunction;
  };

  expect(await routeLoader(document)(args)).toBe(args.request.url);
  expect(await routeLoader(server)(args)).toBe(args.request.url);
  expect(await routeLoader(browser)(args)).toBe(
    'http://producer/shop/product/detail/42?language=de',
  );
  expect(routeLoader(document)).toBe(
    (application.routes[0] as NestedRoute).loader,
  );
  expect(routeLoader(server)).toBe(routeLoader(document));
  expect(routeLoader(browser)).not.toBe(routeLoader(document));
  document.dispose();
  browser.dispose();
  server.dispose();
});
