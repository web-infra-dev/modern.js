import React from 'react';
import { getInstance } from '@module-federation/enhanced/runtime';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import { createModernReactRemote, useRemoteBasename } from '../remote';
import { composeRemoteId, deriveMountId, normalizeRoutePattern } from './match';
import { tagDynamicRoute } from './routes.shared';
import {
  INTERNAL_CONSUMER_KEY,
  INTERNAL_MOUNT_ID_KEY,
  INTERNAL_STORE_KEY,
  type RemoteRoute,
} from './types';
import type { ApplicationsStore } from './store';

function createDynamicRouteComponent(
  route: RemoteRoute,
  parentMountId: string,
  store?: ApplicationsStore,
): React.ComponentType {
  const requestId = composeRemoteId(route.moduleName, route.expose);
  const resolvedInstance = store?.getFederationInstance?.() ?? undefined;
  const Remote = createModernReactRemote({
    ...(resolvedInstance ? { instance: resolvedInstance } : {}),
    remote: () => {
      const instance = store?.getFederationInstance?.() ?? getInstance();
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
      ...(store ? { [INTERNAL_STORE_KEY]: store } : {}),
    };
    return <Remote {...mergedProps} />;
  };
}

export function createBrowserDynamicRoutesBuilder(store?: ApplicationsStore) {
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
        Component = createDynamicRouteComponent(route, parentMountId, store);
        componentCache.set(cacheKey, Component);
      }
      return tagDynamicRoute({
        id: `mf_app_${parentMountId}_${normalizedPath}`,
        path: normalizedPath,
        Component,
      });
    });
}
