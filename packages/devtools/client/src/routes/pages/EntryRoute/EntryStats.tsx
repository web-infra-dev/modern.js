import React from 'react';
import _ from 'lodash';
import { useSnapshot } from 'valtio';
import type { ServerRoute } from '@modern-js/types';
import { Box, Card, Flex, Strong, Text } from '@radix-ui/themes';
import styled from '@emotion/styled';
import { useStore } from '@/stores';

export interface EntryStatsProps {
  route: ServerRoute;
}

export const EntryStats: React.FC<EntryStatsProps> = ({ route }) => {
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

  return (
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
  );
};

const Stats = styled(Card)({
  fontSize: 'var(--font-size-1)',
});
