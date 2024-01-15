import { FileSystemRoutes } from '@modern-js/devtools-kit';
import type { RouteLegacy, ServerRoute } from '@modern-js/types';
import _ from 'lodash';
import React, { Suspense } from 'react';
import { proxy, useSnapshot } from 'valtio';
import { Promisable } from 'type-fest';
import { LegacyRouteStats } from './LegacyRoute/Stats';
import { RemixRouteStats } from './RemixRoute/Stats';
import { $framework, $server } from '@/entries/client/routes/state';
import { useThrowable } from '@/utils';

export const $fileSystemRoutes = proxy<
  Record<string, Promisable<FileSystemRoutes>>
>({});

export interface ClientRouteStatsProps {
  route: ServerRoute;
}

export const ClientRouteStats: React.FC<ClientRouteStatsProps> = ({
  route,
}) => {
  const server = useThrowable($server);
  const framework = useSnapshot($framework);
  const { entrypoints } = framework.context;
  const entrypoint =
    route.entryName && _.find(entrypoints, { entryName: route.entryName });

  if (!entrypoint) {
    throw new Error(
      `Can't found the entrypoint named ${JSON.stringify(route.entryName)}`,
    );
  }

  const $fileSystemRoute = server.remote.getFileSystemRoutes(
    entrypoint.entryName,
  );

  const Dispatcher: React.FC = () => {
    const fileSystemRoute = useThrowable($fileSystemRoute);
    if (isLegacyRoutes(fileSystemRoute as any)) {
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
  routes[0] && !('type' in routes[0]);
