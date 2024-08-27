import { renderNestedRoute } from '@modern-js/runtime-utils/browser';
import {
  UNSAFE_ErrorResponseImpl as ErrorResponseImpl,
  type Router,
  type StaticHandlerContext,
} from '@modern-js/runtime-utils/remix-router';
import { Route, isRouteErrorResponse } from '@modern-js/runtime-utils/router';
import type {
  NestedRoute,
  PageRoute,
  Reporter,
  SSRMode,
} from '@modern-js/types';
import type React from 'react';
import { DefaultNotFound } from './DefaultNotFound';
import DeferredDataScripts from './DeferredDataScripts';
import type { RouterConfig } from './types';

export function getRouteComponents(
  routes: (NestedRoute | PageRoute)[],
  {
    globalApp,
    ssrMode,
    props,
    reporter,
  }: {
    globalApp?: React.ComponentType<any>;
    ssrMode?: SSRMode;
    props?: Record<string, any>;
    reporter?: Reporter;
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
        reporter,
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
  reporter,
}: {
  routesConfig: RouterConfig['routesConfig'];
  props?: Record<string, any>;
  ssrMode?: SSRMode;
  reporter?: Reporter;
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
    reporter,
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
