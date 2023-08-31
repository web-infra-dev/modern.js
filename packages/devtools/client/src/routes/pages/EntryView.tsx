import React from 'react';
import _ from 'lodash';
import { useSnapshot } from 'valtio';
import type { ServerRoute } from '@modern-js/types';
import { RouteObject } from '@modern-js/runtime/router';
import { Box, Card, Flex, Strong, Text } from '@radix-ui/themes';
import styled from '@emotion/styled';
import { RemixRoute } from './RemixRoute';
import { useStore } from '@/stores';

export interface EntryViewProps {
  route: ServerRoute;
}

const EntryView: React.FC<EntryViewProps> = ({ route }) => {
  console.log('route: ', route);
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
    <Flex gap="2" direction="column">
      <Stats>
        <Box>
          <Flex gap="1">
            <Strong>Directory: </Strong>
            <Text>{entrypoint.absoluteEntryDir}</Text>
          </Flex>
          <Flex gap="1">
            <Strong>Entry:</Strong>
            <Text>{entrypoint.entry}</Text>
          </Flex>
        </Box>
      </Stats>
      {fileSystemRoute.map(r => (
        <RemixRoute
          key={r.id}
          route={{ ...r, path: route.urlPath + (r.path ?? '') }}
        />
      ))}
    </Flex>
  );
};

export default EntryView;

const Stats = styled(Card)({
  fontSize: 'var(--font-size-1)',
});
