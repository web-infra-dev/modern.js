import React from 'react';
import _ from 'lodash';
import { useSnapshot } from 'valtio';
import type { ServerRoute } from '@modern-js/types';
import { RouteObject } from '@modern-js/runtime/router';
import { Box } from '@radix-ui/themes';
import { RemixRoute } from './RemixRoute';
import { useStore } from '@/stores';

export interface EntryViewProps {
  route: ServerRoute;
}

const EntryView: React.FC<EntryViewProps> = ({ route }) => {
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

  const { fileSystemRoutes } = store.framework;
  const fileSystemRoute = fileSystemRoutes[
    entrypoint.entryName
  ] as unknown as RouteObject[];

  return (
    <Box>
      {fileSystemRoute.map(r => (
        <RemixRoute
          key={r.id}
          route={{ ...r, path: route.urlPath + (r.path ?? '') }}
        />
      ))}
    </Box>
  );
};

export default EntryView;
