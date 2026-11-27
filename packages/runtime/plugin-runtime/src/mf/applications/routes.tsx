import React from 'react';
import { getInstance } from '@module-federation/enhanced/runtime';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import { createModernReactRemote, useRemoteBasename } from '../remote';
import { composeRemoteId, deriveMountId, normalizeRoutePattern } from './match';
import { tagDynamicRoute } from './routes.shared';
import {
  INTERNAL_CONSUMER_KEY,
  INTERNAL_MOUNT_ID_KEY,
  type RemoteRoute,
} from './types';

function createDynamicRouteComponent(
  route: RemoteRoute,
  parentMountId: string,
): React.ComponentType {
  const requestId = composeRemoteId(route.moduleName, route.expose);
  const Remote = createModernReactRemote({
    remote: () => {
      const instance = getInstance();
      if (!instance) {
        throw new Error(
          `[Modern.js Module Federation] An initialized MF runtime instance is required to load "${requestId}".`,
        );
      }
      return instance.loadRemote(requestId);
    },
  });

  return function DynamicApplicationRoute() {
    const matchedBasename = useRemoteBasename();
    const mountId = deriveMountId(
      parentMountId,
      matchedBasename,
      route.moduleName,
      route.expose,
    );
    const mergedProps: Record<string, unknown> = {
      ...(route.props || {}),
      [INTERNAL_MOUNT_ID_KEY]: mountId,
      [INTERNAL_CONSUMER_KEY]: {
        moduleName: route.moduleName,
        expose: route.expose,
        versionOrUrl: route.versionOrUrl,
      },
    };
    return <Remote {...mergedProps} />;
  };
}

export function createBrowserDynamicRoutesBuilder() {
  const componentCache = new Map<string, React.ComponentType>();

  return (
    routes: readonly RemoteRoute[],
    parentMountId: string,
  ): RouteObject[] =>
    routes.map(route => {
      const normalizedPath = normalizeRoutePattern(route.route) || '/';
      const cacheKey = `${parentMountId}::${normalizedPath}::${route.moduleName}::${route.expose}::${route.versionOrUrl}::${JSON.stringify(route.props || null)}`;
      let Component = componentCache.get(cacheKey);
      if (!Component) {
        Component = createDynamicRouteComponent(route, parentMountId);
        componentCache.set(cacheKey, Component);
      }
      return tagDynamicRoute({
        id: `mf_app_${parentMountId}_${normalizedPath}`,
        path: normalizedPath,
        Component,
      });
    });
}
