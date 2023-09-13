import {
  RouteMatch,
  RouteObject,
  matchRoutes as matchRemixRoutes,
} from '@modern-js/runtime/router';
import type { ServerRoute } from '@modern-js/types';
import { Flex } from '@radix-ui/themes';
import React, { useContext, useMemo } from 'react';
import { MatchUrlContext } from '../../MatchUrl';
import { MatchRemixRouteContext } from '../MatchRemixRouteContext';
import { RemixRoute } from './RemixRoute';

export interface RemixRouteStatsProps {
  remixRoutes: RouteObject[];
  route: ServerRoute;
}

export const RemixRouteStats: React.FC<RemixRouteStatsProps> = ({
  remixRoutes,
  route,
}) => {
  const testingUrl = useContext(MatchUrlContext);
  const matchedRoutes = useMemo(() => {
    if (!testingUrl || !remixRoutes) return [];
    const location = testingUrl.replace(route.urlPath, '');
    const matched = matchRemixRoutes(remixRoutes, location) ?? [];
    return matched as RouteMatch<string, RouteObject>[];
  }, [remixRoutes, testingUrl]);

  if (!remixRoutes.length) return null;

  return (
    <MatchRemixRouteContext.Provider value={matchedRoutes}>
      <Flex gap="2" direction="column">
        {remixRoutes.map(r => (
          <RemixRoute
            key={r.id}
            route={{ ...r, path: route.urlPath + (r.path ?? '') }}
          />
        ))}
      </Flex>
    </MatchRemixRouteContext.Provider>
  );
};
