import type React from 'react';
import { Badge, Card } from '@radix-ui/themes';
import type { ServerRoute } from '@modern-js/types';
import { BaseRoute } from './Base';

export interface UnknownRouteProps {
  route: ServerRoute;
}

export const UnknownRoute: React.FC<UnknownRouteProps> = ({ route }) => {
  return (
    <BaseRoute badge={badge} route={route} title={route.urlPath}>
      <Card>Unknown route type.</Card>
    </BaseRoute>
  );
};

const badge = <Badge color="gray">Unknown</Badge>;
