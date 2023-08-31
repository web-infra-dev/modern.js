import React from 'react';
import type { ServerRoute as IServerRoute } from '@modern-js/types';
import _ from 'lodash';
import EntryRoute from './EntryRoute/EntryRoute';
import UnknownRoute from './UnknownRoute';

export interface ServerRouteProps {
  route: IServerRoute;
}

export const ServerRoute: React.FC<ServerRouteProps> = ({ route }) => {
  return dispatchServerRoute(route);
};

const dispatchServerRoute = (route: IServerRoute) => {
  if (_.isString(route.entryName)) {
    return <EntryRoute route={route} />;
  } else {
    return <UnknownRoute route={route} />;
  }
};
