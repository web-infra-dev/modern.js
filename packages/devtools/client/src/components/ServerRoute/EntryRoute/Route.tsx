import React from 'react';
import { Badge, Flex, Box } from '@radix-ui/themes';
import { ServerRoute } from '@modern-js/types';
import { BaseRoute } from '../Base';
import { EntryStats } from './Stats';
import { ClientRouteStats } from './ClientRoute';

export interface EntryRouteProps {
  route: ServerRoute;
}

export const EntryRoute: React.FC<EntryRouteProps> = ({ route }) => {
  return (
    <BaseRoute badge={badge} route={route} title={route.urlPath}>
      <Flex direction="column" gap="2">
        <EntryStats route={route} />
        <Box style={{ overflow: 'scroll hidden' }}>
          <ClientRouteStats route={route} />
        </Box>
      </Flex>
    </BaseRoute>
  );
};

const badge = <Badge color="cyan">Entry</Badge>;
