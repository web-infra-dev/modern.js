import {
  RouteMatch,
  RouteObject,
  matchRoutes as matchRemixRoutes,
} from '@modern-js/runtime/router';
import type { ServerRoute } from '@modern-js/types';
import { Flex } from '@radix-ui/themes';
import React, { useContext, useMemo } from 'react';
import { cleanDoubleSlashes } from 'ufo';
import { MatchUrlContext } from '../../../Context';
import { MatchRemixRouteContext } from './Context';
import { RemixRoute } from './Route';

export interface RemixRouteStatsProps {
  remixRoutes: RouteObject[];
  route: ServerRoute;
}

export const RemixRouteStats: React.FC<RemixRouteStatsProps> = ({
  remixRoutes,
  route,
}) => {
  const { matched: matchedServerRoute, url } = useContext(MatchUrlContext);
  const matchedRoutes = useMemo(() => {
    if (matchedServerRoute === route) {
      if (!remixRoutes) return [];
      const location = cleanDoubleSlashes(url.replace(route.urlPath, '/'));
      const matched = matchRemixRoutes(remixRoutes, location) ?? [];
      return matched.length
        ? (matched as RouteMatch<string, RouteObject>[])
        : false;
    } else {
      return matchedServerRoute ? false : [];
    }
  }, [remixRoutes, matchedServerRoute, url]);

  if (!remixRoutes?.length) return null;

  return (
    <MatchRemixRouteContext.Provider value={matchedRoutes}>
      <Flex gap="2" direction="column">
        {remixRoutes.map(r => (
          <RemixRoute key={r.id} route={r} />
        ))}
      </Flex>
    </MatchRemixRouteContext.Provider>
  );
};
