import React from 'react';
import { Badge, Flex } from '@radix-ui/themes';
import { ServerRoute } from '@modern-js/types';
import { BaseRoute } from '../BaseRoute';
import { EntryStats } from './EntryStats';
import { ClientRouteStats } from './ClientRouteStats';

export interface EntryRouteProps {
  route: ServerRoute;
}

const EntryRoute: React.FC<EntryRouteProps> = ({ route }) => {
  return (
    <BaseRoute badge={badge} route={route} title={route.urlPath}>
      <Flex direction="column" gap="2">
        <EntryStats route={route} />
        <ClientRouteStats route={route} />
      </Flex>
    </BaseRoute>
  );
};

export default EntryRoute;

const badge = <Badge color="cyan">Entry</Badge>;
