import type { RouteObject } from '@modern-js/runtime-utils/router';
import type { NestedRoute, PageRoute, SSRMode } from '@modern-js/types';
import React from 'react';
import { DefaultNotFound } from './DefaultNotFound';

type RouterConfig = {
  routesConfig: {
    globalApp?: React.ComponentType<any>;
    routes?: (NestedRoute | PageRoute)[];
  };
};

type LayoutWrapperProps = {
  [key: string]: unknown;
};

type GlobalAppProps = {
  Component: React.ComponentType;
  [key: string]: unknown;
};

export type ModernRouteObject = RouteObject & {
  isClientComponent?: boolean;
  hasClientLoader?: boolean;
  hasLoader?: boolean;
  hasAction?: boolean;
  lazyImport?: () => Promise<{ default: React.ComponentType }>;
};

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
        hasLoader: Boolean(route.loader),
        hasClientLoader: Boolean(route.clientData),
        hasAction: Boolean(route.action),
        ...(route.isClientComponent ? { isClientComponent: true } : {}),
        Component: route.component ? route.component : undefined,
        errorElement: route.error ? <route.error /> : undefined,
        children: route.children
          ? route.children.map(
              child =>
                getRouteObjects([child], { globalApp, ssrMode, props })[0],
            )
          : undefined,
      } as ModernRouteObject;

      routeObjects.push(nestedRouteObject);
    } else if (
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
