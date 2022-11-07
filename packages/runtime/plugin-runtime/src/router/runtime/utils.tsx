import React, { Suspense } from 'react';
import { Route, RouteProps } from 'react-router-dom';
import type { NestedRoute, PageRoute } from '@modern-js/types';
import { RouterConfig } from './types';
import { DefaultNotFound } from './DefaultNotFound';

const renderNestedRoute = (nestedRoute: NestedRoute, parent?: NestedRoute) => {
  const { children, index, id, component: Component } = nestedRoute;
  const childElements = children?.map(childRoute => {
    return renderNestedRoute(childRoute, nestedRoute);
  });

  const routeProps: Omit<RouteProps, 'children'> = {
    caseSensitive: nestedRoute.caseSensitive,
    path: nestedRoute.path,
    id: nestedRoute.id,
    loader: nestedRoute.loader,
    action: nestedRoute.action,
    hasErrorBoundary: nestedRoute.hasErrorBoundary,
    shouldRevalidate: nestedRoute.shouldRevalidate,
    handle: nestedRoute.handle,
    index: nestedRoute.index,
    errorElement: nestedRoute.errorElement,
  };

  if (nestedRoute.error) {
    const errorElement = <nestedRoute.error />;
    routeProps.errorElement = errorElement;
  }

  if (Component) {
    if (parent?.loading) {
      const Loading = parent.loading;
      routeProps.element = (
        <Suspense fallback={<Loading />}>
          <Component />
        </Suspense>
      );
    } else {
      routeProps.element = (
        <Suspense>
          <Component />
        </Suspense>
      );
    }
  }

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
