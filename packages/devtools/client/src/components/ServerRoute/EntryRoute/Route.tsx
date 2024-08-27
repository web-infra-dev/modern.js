import type { ServerRoute } from '@modern-js/types';
import { Badge, Flex, ScrollArea } from '@radix-ui/themes';
import type React from 'react';
import { Suspense } from 'react';
import { BaseRoute } from '../Base';
import { ClientRouteStats } from './ClientRoute';
import { EntryStats } from './Stats';

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
