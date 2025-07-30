import { renderNestedRoute } from '@modern-js/runtime-utils/browser';
import {
  UNSAFE_ErrorResponseImpl as ErrorResponseImpl,
  type Router,
  type StaticHandlerContext,
} from '@modern-js/runtime-utils/remix-router';
import {
  Route,
  type RouteObject,
  isRouteErrorResponse,
} from '@modern-js/runtime-utils/router';
import type { NestedRoute, PageRoute, SSRMode } from '@modern-js/types';
import React from 'react';
import { DefaultNotFound } from './DefaultNotFound';
import DeferredDataScripts from './DeferredDataScripts';
import type { RouterConfig } from './types';

export function getRouteComponents(
  routes: (NestedRoute | PageRoute)[],
  {
    globalApp,
    ssrMode,
    props,
  }: {
    globalApp?: React.ComponentType<GlobalAppProps>;
    ssrMode?: SSRMode;
    props?: Record<string, unknown>;
  },
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
      const routeElement = renderNestedRoute(route, {
        DeferredDataComponent:
          ssrMode === 'stream' ? DeferredDataScripts : undefined,
        props,
      });
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

interface LayoutWrapperProps {
  [key: string]: unknown;
}

interface GlobalAppProps {
  Component: React.ComponentType;
  [key: string]: unknown;
}

export function getRouteObjects(
  routes: (NestedRoute | PageRoute)[],
  {
    globalApp,
    ssrMode,
    props,
  }: {
    globalApp?: React.ComponentType<GlobalAppProps>;
    ssrMode?: SSRMode;
    props?: Record<string, unknown>;
  },
) {
  const createLayoutElement = (
    Component: React.ComponentType,
  ): React.ComponentType => {
    const GlobalLayout = globalApp;
    if (!GlobalLayout) {
      return Component;
    }

    const LayoutWrapper = (props: LayoutWrapperProps) => {
      const LayoutComponent = GlobalLayout;
      return <LayoutComponent Component={Component} {...props} />;
    };

    return LayoutWrapper;
  };

  const routeObjects: RouteObject[] = [];

  for (const route of routes) {
    if (route.type === 'nested') {
      const nestedRouteObject = {
        path: route.path,
        id: route.id,
        loader: route.loader,
        action: route.action,
        hasErrorBoundary: route.hasErrorBoundary,
        shouldRevalidate: route.shouldRevalidate,
        handle: {
          ...route.handle,
          ...(typeof route.config === 'object' ? route.config?.handle : {}),
        },
        index: route.index,
        hasClientLoader: !!route.clientData,
        Component: route.component ? route.component : undefined,
        errorElement: route.error ? <route.error /> : undefined,
        children: route.children
          ? route.children.map(
              child =>
                getRouteObjects([child], { globalApp, ssrMode, props })[0],
            )
          : undefined,
      } as RouteObject;

      routeObjects.push(nestedRouteObject);
    } else {
      if (
        typeof route.component === 'function' ||
        typeof route.component === 'object'
      ) {
        const LayoutComponent = createLayoutElement(
          route.component as React.ComponentType,
        );
        const routeObject: RouteObject = {
          path: route.path,
          element: React.createElement(LayoutComponent),
        };

        routeObjects.push(routeObject);
      }
    }
  }

  routeObjects.push({
    path: '*',
    element: <DefaultNotFound />,
  });

  return routeObjects;
}

export function createRouteObjectsFromConfig({
  routesConfig,
  props,
  ssrMode,
}: {
  routesConfig: RouterConfig['routesConfig'];
  props?: Record<string, unknown>;
  ssrMode?: SSRMode;
}): RouteObject[] | null {
  if (!routesConfig) {
    return null;
  }
  const { routes, globalApp } = routesConfig;
  if (!routes) {
    return null;
  }
  return getRouteObjects(routes, {
    globalApp,
    ssrMode,
    props,
  });
}

export function renderRoutes({
  routesConfig,
  props,
  ssrMode,
}: {
  routesConfig: RouterConfig['routesConfig'];
  props?: Record<string, unknown>;
  ssrMode?: SSRMode;
}) {
  if (!routesConfig) {
    return null;
  }
  const { routes, globalApp } = routesConfig;
  if (!routes) {
    return null;
  }
  const routeElements = getRouteComponents(routes, {
    globalApp,
    ssrMode,
    props,
  });
  return routeElements;
}

export function getLocation(
  serverContext: { request?: { pathname?: string; url?: string } } | undefined,
): string {
  const { pathname = '', url = '' } = serverContext?.request || {};

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

/**
 * forked from https://github.com/remix-run/remix/blob/main/packages/remix-server-runtime/errors.ts
 * license at https://github.com/remix-run/remix/blob/main/LICENSE.md
 */
export function serializeErrors(
  errors: StaticHandlerContext['errors'],
): StaticHandlerContext['errors'] {
  if (!errors) {
    return null;
  }
  const entries = Object.entries(errors);
  const serialized: StaticHandlerContext['errors'] = {};
  for (const [key, val] of entries) {
    // Hey you!  If you change this, please change the corresponding logic in
    // deserializeErrors
    if (isRouteErrorResponse(val)) {
      serialized[key] = { ...val, __type: 'RouteErrorResponse' };
    } else if (val instanceof Error) {
      serialized[key] = {
        message: val.message,
        stack: val.stack,
        __type: 'Error',
      };
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}

/**
 * forked from https://github.com/remix-run/remix/blob/main/packages/remix-react/errors.ts
 * license at https://github.com/remix-run/remix/blob/main/LICENSE.md
 */
export function deserializeErrors(
  errors: Router['state']['errors'],
): Router['state']['errors'] {
  if (!errors) {
    return null;
  }
  const entries = Object.entries(errors);
  const serialized: Router['state']['errors'] = {};
  for (const [key, val] of entries) {
    // Hey you!  If you change this, please change the corresponding logic in
    // serializeErrors
    if (val && val.__type === 'RouteErrorResponse') {
      serialized[key] = new ErrorResponseImpl(
        val.status,
        val.statusText,
        val.data,
        val.internal === true,
      );
    } else if (val && val.__type === 'Error') {
      const error = new Error(val.message);
      error.stack = val.stack;
      serialized[key] = error;
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}
