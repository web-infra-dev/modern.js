import React from 'react';
import { getInstance } from '@module-federation/enhanced/runtime';
import type { RouteObject } from '@modern-js/runtime-utils/router';
import { createModernReactRemote, useRemoteBasename } from '../remote.node';
import { composeRemoteId, deriveMountId, normalizeRoutePattern } from './match';
import { isClientOnlyRemoteSnapshot, tagDynamicRoute } from './routes.shared';
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
  const noSSR = isClientOnlyRemoteSnapshot(route);
  const Remote = createModernReactRemote({
    ...(resolvedInstance ? { instance: resolvedInstance } : {}),
    // Forward optional render hint for legacy Bridge producers lacking
    // manifest `exposes[i].render` metadata.
    ...(route.render ? { render: route.render } : {}),
    // Skip Node execution for pure CSR producers without an `ssrRemoteEntry`.
    ...(noSSR ? { noSSR: true } : {}),
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

export function createServerDynamicRoutesBuilder(store?: ApplicationsStore) {
  return (
    routes: readonly RemoteRoute[],
    parentMountId: string,
  ): RouteObject[] =>
    routes.map(route => {
      const normalizedPath = normalizeRoutePattern(route.route) || '/';
      const Component = createDynamicRouteComponent(
        route,
        parentMountId,
        store,
      );
      return tagDynamicRoute({
        id: `mf_app_${parentMountId}_${normalizedPath}`,
        path: normalizedPath,
        Component,
      });
    });
}
