import React from 'react';
import { Badge, Card } from '@radix-ui/themes';
import { ServerRoute } from '@modern-js/types';
import { BaseRoute } from './BaseRoute';

export interface UnknownRouteProps {
  route: ServerRoute;
}

const UnknownRoute: React.FC<UnknownRouteProps> = ({ route }) => {
  return (
    <BaseRoute badge={badge} route={route} title={route.urlPath}>
      <Card>Unknown route type.</Card>
    </BaseRoute>
  );
};

export default UnknownRoute;

const badge = <Badge color="gray">Unknown</Badge>;
