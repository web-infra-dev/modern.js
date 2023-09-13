import { FileSystemRoutes } from '@modern-js/devtools-kit';
import type { RouteLegacy, ServerRoute } from '@modern-js/types';
import _ from 'lodash';
import React from 'react';
import { useSnapshot } from 'valtio';
import { LegacyRouteStats } from './LegacyRouteStats';
import { RemixRouteStats } from './RemixRouteStats';
import { useStore } from '@/stores';

export interface ClientRouteStatsProps {
  route: ServerRoute;
}

export const ClientRouteStats: React.FC<ClientRouteStatsProps> = ({
  route,
}) => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { entrypoints } = store.framework.context;
  const entrypoint =
    route.entryName && _.find(entrypoints, { entryName: route.entryName });

  if (!entrypoint) {
    throw new Error(
      `Can't found the entrypoint named ${JSON.stringify(route.entryName)}`,
    );
  }

  const fileSystemRoute =
    store.framework.fileSystemRoutes[entrypoint.entryName];

  if (isLegacyRoutes(fileSystemRoute as any)) {
    return <LegacyRouteStats />;
  } else {
    return (
      <RemixRouteStats remixRoutes={fileSystemRoute as any} route={route} />
    );
  }
};

const isLegacyRoutes = (routes: FileSystemRoutes): routes is RouteLegacy[] =>
  routes[0] && !('type' in routes[0]);
