import { FileSystemRoutes } from '@modern-js/devtools-kit/runtime';
import type { RouteLegacy, ServerRoute } from '@modern-js/types';
import _ from 'lodash';
import React, { Suspense } from 'react';
import { proxy, useSnapshot } from 'valtio';
import { Promisable } from 'type-fest';
import { LegacyRouteStats } from './LegacyRoute/Stats';
import { RemixRouteStats } from './RemixRoute/Stats';
import { useGlobals } from '@/entries/client/globals';

export const $fileSystemRoutes = proxy<
  Record<string, Promisable<FileSystemRoutes>>
>({});

export interface ClientRouteStatsProps {
  route: ServerRoute;
}

export const ClientRouteStats: React.FC<ClientRouteStatsProps> = ({
  route,
}) => {
  const { entryName } = route;
  if (!entryName) {
    throw new TypeError('');
  }
  const $globals = useGlobals();
  const { entrypoints } = useSnapshot($globals.framework).context;
  const entrypoint = _.find(entrypoints, { entryName });
  if (!entrypoint) {
    throw new TypeError(
      `Can't found the entrypoint named ${JSON.stringify(route.entryName)}`,
    );
  }
  const fileSystemRoutes = useSnapshot($globals.fileSystemRoutes);
  const fileSystemRoute = fileSystemRoutes[entrypoint.entryName];

  if (!entrypoint) {
    throw new Error(
      `Can't found the entrypoint named ${JSON.stringify(route.entryName)}`,
    );
  }

  const Dispatcher: React.FC = () => {
    if (isLegacyRoutes(fileSystemRoute as FileSystemRoutes)) {
      return <LegacyRouteStats />;
    } else {
      return (
        <RemixRouteStats remixRoutes={fileSystemRoute as any} route={route} />
      );
    }
  };
  return (
    <Suspense>
      <Dispatcher />
    </Suspense>
  );
};

const isLegacyRoutes = (routes: FileSystemRoutes): routes is RouteLegacy[] =>
  routes?.[0] && !('type' in routes[0]);
