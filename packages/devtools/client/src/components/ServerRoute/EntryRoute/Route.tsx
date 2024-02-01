import React, { Suspense } from 'react';
import { Badge, Flex, ScrollArea } from '@radix-ui/themes';
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
        <ScrollArea scrollbars="horizontal">
          <EntryStats route={route} />
        </ScrollArea>
        <ScrollArea scrollbars="horizontal">
          <Suspense>
            <ClientRouteStats route={route} />
          </Suspense>
        </ScrollArea>
      </Flex>
    </BaseRoute>
  );
};

const badge = <Badge color="cyan">Entry</Badge>;
