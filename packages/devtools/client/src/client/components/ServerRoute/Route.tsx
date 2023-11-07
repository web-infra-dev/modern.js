import React from 'react';
import type { ServerRoute as IServerRoute } from '@modern-js/types';
import _ from 'lodash';
import { EntryRoute } from './EntryRoute';
import { UnknownRoute } from './Unknown';

export interface ServerRouteProps {
  route: IServerRoute;
}

export const ServerRoute: React.FC<ServerRouteProps> = ({ route }) => {
  if (_.isString(route.entryName)) {
    return <EntryRoute route={route} />;
  } else {
    return <UnknownRoute route={route} />;
  }
};
