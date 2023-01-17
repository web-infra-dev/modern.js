import React, { Suspense } from 'react';
import { Route, RouteProps } from 'react-router-dom';
import type { LoaderFunction, LoaderFunctionArgs } from 'react-router-dom';
import type { NestedRoute, PageRoute } from '@modern-js/types';
import { RouterConfig } from './types';
import { DefaultNotFound } from './DefaultNotFound';

const renderNestedRoute = (nestedRoute: NestedRoute, parent?: NestedRoute) => {
  const { children, index, id, component, isRoot } = nestedRoute;
  const Component = component as unknown as React.ComponentType<any>;

  const routeProps: Omit<RouteProps, 'children'> = {
    caseSensitive: nestedRoute.caseSensitive,
    path: nestedRoute.path,
    id: nestedRoute.id,
    loader: createLoader(nestedRoute),
    action: nestedRoute.action,
    hasErrorBoundary: nestedRoute.hasErrorBoundary,
    shouldRevalidate: nestedRoute.shouldRevalidate,
    handle: nestedRoute.handle,
    index: nestedRoute.index,
    element: nestedRoute.element,
    errorElement: nestedRoute.errorElement,
  };

  if (nestedRoute.error) {
    const errorElement = <nestedRoute.error />;
    routeProps.errorElement = errorElement;
  }

  let element;

  if (Component) {
    if (parent?.loading) {
      const Loading = parent.loading;
      if (isLoadableComponent(Component)) {
        element = <Component fallback={<Loading />} />;
      } else {
        element = (
          <Suspense fallback={<Loading />}>
            <Component />
          </Suspense>
        );
      }
    } else if (isLoadableComponent(Component) || isRoot) {
      element = <Component />;
    } else {
      element = (
        <Suspense fallback={null}>
          <Component />
        </Suspense>
      );
    }
  } else {
    // If the component is undefined, it means that the current component is a fake layout component,
    // and it should inherit the loading of the parent component to make the loading of the parent layout component take effect.
    // It also means when layout component is undefined, loading component in then same dir should not working.
    nestedRoute.loading = parent?.loading;
  }

  if (element) {
    routeProps.element = element;
  }

  const childElements = children?.map(childRoute => {
    return renderNestedRoute(childRoute, nestedRoute);
  });

  const routeElement = index ? (
    <Route key={id} {...routeProps} index={true} />
  ) : (
    <Route key={id} {...routeProps} index={false}>
      {childElements}
    </Route>
  );

  return routeElement;
};

export function getRouteComponents(
  routes: (NestedRoute | PageRoute)[],
  globalApp?: React.ComponentType<any>,
) {
  const Layout = ({ Component, ...props }: any) => {
    const GlobalLayout = globalApp;
    if (!GlobalLayout) {
      return <Component {...props} />;
    }

    return <GlobalLayout Component={Component} {...props} />;
  };
  const routeElements: React.ReactElement[] = [];
  for (const route of routes) {
    if (route.type === 'nested') {
      const routeElement = renderNestedRoute(route);
      routeElements.push(routeElement);
    } else {
      const routeElement = (
        <Route
          key={route.path}
          path={route.path}
          element={<Layout Component={route.component} />}
        />
      );
      routeElements.push(routeElement);
    }
  }
  routeElements.push(<Route key="*" path="*" element={<DefaultNotFound />} />);
  return routeElements;
}

export function renderRoutes(routesConfig: RouterConfig['routesConfig']) {
  if (!routesConfig) {
    return null;
  }
  const { routes, globalApp } = routesConfig;
  if (!routes) {
    return null;
  }
  const routeElements = getRouteComponents(routes, globalApp);
  return routeElements;
}

export function getLocation(serverContext: any): string {
  const { pathname, url }: { [p: string]: string } =
    serverContext?.request || {};

  const cleanUrl = url?.replace('http://', '')?.replace('https://', '');

  const index = (cleanUrl || '').indexOf(pathname);

  if (index === -1) {
    return pathname;
  }

  return cleanUrl.substring(index);
}

export const urlJoin = (...parts: string[]) => {
  const separator = '/';
  const replace = new RegExp(`${separator}{1,}`, 'g');
  return standardSlash(parts.join(separator).replace(replace, separator));
};

export function standardSlash(str: string) {
  let addr = str;
  if (!addr || typeof addr !== 'string') {
    return addr;
  }
  if (addr.startsWith('.')) {
    addr = addr.slice(1);
  }
  if (!addr.startsWith('/')) {
    addr = `/${addr}`;
  }
  if (addr.endsWith('/') && addr !== '/') {
    addr = addr.slice(0, addr.length - 1);
  }

  return addr;
}

function createLoader(route: NestedRoute): LoaderFunction {
  const { loader } = route;
  if (loader) {
    return (args: LoaderFunctionArgs) => {
      if (typeof route.lazyImport === 'function') {
        route.lazyImport();
      }
      return loader(args);
    };
  } else {
    return () => {
      if (typeof route.lazyImport === 'function') {
        route.lazyImport();
      }
      return null;
    };
  }
}

function isLoadableComponent(component: React.ComponentType<any>) {
  return (
    component &&
    component.displayName === 'Loadable' &&
    (component as any).preload &&
    typeof (component as any).preload === 'function'
  );
}
