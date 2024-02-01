import React from 'react';
import _ from 'lodash';
import { useSnapshot } from 'valtio';
import type { ServerRoute } from '@modern-js/types';
import { Box, Flex, Strong, Text } from '@radix-ui/themes';
import styles from './Stats.module.scss';
import { $framework } from '@/entries/client/routes/state';

export interface EntryStatsProps {
  route: ServerRoute;
}

export const EntryStats: React.FC<EntryStatsProps> = ({ route }) => {
  const framework = useSnapshot($framework);
  const { entrypoints } = framework.context;
  const entrypoint =
    route.entryName && _.find(entrypoints, { entryName: route.entryName });

  if (!entrypoint) {
    throw new Error(
      `Can't found the entrypoint named ${JSON.stringify(route.entryName)}`,
    );
  }

  return (
    <Box className={styles.stats}>
      <Flex gap="1">
        <Strong>Directory: </Strong>
        <Text>{entrypoint.absoluteEntryDir}</Text>
      </Flex>
      <Flex gap="1">
        <Strong>Entry:</Strong>
        <Text>{entrypoint.entry}</Text>
      </Flex>
    </Box>
  );
};
