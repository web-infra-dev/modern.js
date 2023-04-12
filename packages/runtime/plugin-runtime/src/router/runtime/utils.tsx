import React from 'react';
import { Route } from 'react-router-dom';
import {
  type NestedRoute,
  type PageRoute,
  type SSRMode,
} from '@modern-js/types';
import {
  ErrorResponse,
  isRouteErrorResponse,
  type Router,
  type StaticHandlerContext,
} from '@modern-js/utils/universal/remix-router';
import { renderNestedRoute } from '@modern-js/utils/universal/nestedRoutes';
import { RouterConfig } from './types';
import { DefaultNotFound } from './DefaultNotFound';
import DeferredDataScripts from './DeferredDataScripts';

export function getRouteComponents(
  routes: (NestedRoute | PageRoute)[],
  {
    globalApp,
    ssrMode,
    props,
  }: {
    globalApp?: React.ComponentType<any>;
    ssrMode?: SSRMode;
    props?: Record<string, any>;
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

export function renderRoutes({
  routesConfig,
  props,
  ssrMode,
}: {
  routesConfig: RouterConfig['routesConfig'];
  props?: Record<string, any>;
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
      serialized[key] = new ErrorResponse(
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
