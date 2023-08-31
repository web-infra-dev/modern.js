import React, { useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';
import type {
  NestedRouteForCli,
  PageRoute,
  RouteLegacy,
} from '@modern-js/types';
import { matchRoutes as matchRemixRoutes } from '@modern-js/runtime/router';
import styled from '@emotion/styled';
import * as ufo from 'ufo';
import { Box, Text, TextField } from '@radix-ui/themes';
import type { FileSystemRoutes } from '@modern-js/devtools-kit';
import { ServerRoute } from './ServerRoute';
import { MatchUrlContext } from './MatchUrl';
import { useStore } from '@/stores';

const isLegacyRoutes = (routes: FileSystemRoutes): routes is RouteLegacy[] =>
  routes[0] && !('type' in routes[0]);

const matchLegacyRoutes = (_routes: RouteLegacy[], _location: string) => {
  // TODO: implement
  return null;
};

export const matchRoutes = (
  routes: (NestedRouteForCli | PageRoute)[],
  location: string,
) => matchRemixRoutes(routes as any, location);

const useMatchUrl = (url: string) => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { serverRoutes } = store.framework.context;
  const fileSystemRoutes = store.framework.fileSystemRoutes as Record<
    string,
    FileSystemRoutes
  >;
  const serverRoute = useMemo(() => {
    if (!url) return null;
    const { pathname } = ufo.parseURL(url);
    return serverRoutes.find(
      route =>
        pathname === route.urlPath || pathname.startsWith(`${route.urlPath}/`),
    );
  }, [url]);
  const fileSystemRoute =
    (serverRoute?.entryName &&
      serverRoute.entryName in fileSystemRoutes &&
      fileSystemRoutes[serverRoute.entryName]) ||
    null;

  const matchedRoutes = useMemo(() => {
    const routes = fileSystemRoute;
    if (!url || !routes) {
      return null;
    }
    const _url = url.replace(serverRoute!.urlPath, '');
    if (isLegacyRoutes(routes)) {
      return matchLegacyRoutes(routes, _url);
    } else {
      return matchRoutes(routes as any, _url);
    }
  }, [fileSystemRoute, url]);

  return { server: serverRoute ?? null, client: matchedRoutes ?? null };
};

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { serverRoutes } = store.framework.context;

  const [testingUrl, setTestingUrl] = useState<string>('');
  const matchedRoute = useMatchUrl(testingUrl);

  return (
    <MatchUrlContext.Provider value={matchedRoute}>
      <Container>
        <Box>
          <TextField.Root>
            <TextField.Slot>
              <Text size="2">test:</Text>
            </TextField.Slot>
            <TextField.Input
              placeholder="/foo?bar#baz"
              onChange={e => setTestingUrl(e.target.value)}
            />
          </TextField.Root>
        </Box>
        <Box height="2" />
        <RoutesContainer>
          {serverRoutes.map(route => (
            <ServerRoute key={route.entryPath} route={route} />
          ))}
        </RoutesContainer>
      </Container>
    </MatchUrlContext.Provider>
  );
};

export default Page;

const Container = styled(Box)({});

const RoutesContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
  justifyContent: 'space-between',
});
