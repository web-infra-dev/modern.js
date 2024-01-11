import { FileSystemRoutes } from '@modern-js/devtools-kit';
import type { RouteLegacy, ServerRoute } from '@modern-js/types';
import _ from 'lodash';
import React from 'react';
import { proxy, useSnapshot } from 'valtio';
import { Promisable } from 'type-fest';
import { LegacyRouteStats } from './LegacyRoute/Stats';
import { RemixRouteStats } from './RemixRoute/Stats';
import { $framework, $server } from '@/entries/client/routes/state';

export const $fileSystemRoutes = proxy<
  Record<string, Promisable<FileSystemRoutes>>
>({});

$server.then(({ hooks, remote }) => {
  remote.getFileSystemRoutes('');
  hooks.hook('updateFileSystemRoutes', ({ entrypoint, routes }) => {
    $fileSystemRoutes[entrypoint.entryName] = routes;
  });
});

export interface ClientRouteStatsProps {
  route: ServerRoute;
}

export const ClientRouteStats: React.FC<ClientRouteStatsProps> = ({
  route,
}) => {
  const framework = useSnapshot($framework);
  const fileSystemRoutes = useSnapshot($fileSystemRoutes);
  const { entrypoints } = framework.context;
  const entrypoint =
    route.entryName && _.find(entrypoints, { entryName: route.entryName });

  if (!entrypoint) {
    throw new Error(
      `Can't found the entrypoint named ${JSON.stringify(route.entryName)}`,
    );
  }

  const fileSystemRoute = fileSystemRoutes[entrypoint.entryName];

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
