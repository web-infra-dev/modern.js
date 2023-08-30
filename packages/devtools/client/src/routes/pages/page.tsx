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
import { useStore } from '@/stores';

const isLegacyRoutes = (routes: FileSystemRoutes): routes is RouteLegacy[] =>
  !('type' in routes[0]);

const matchLegacyRoutes = (_routes: RouteLegacy[], _location: string) => {
  // TODO: implement
  return null;
};

export const matchRoutes = (
  routes: (NestedRouteForCli | PageRoute)[],
  location: string,
) => matchRemixRoutes(routes as any, location);

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { serverRoutes } = store.framework.context;
  const fileSystemRoutes = store.framework.fileSystemRoutes as Record<
    string,
    FileSystemRoutes
  >;

  const [testingUrl, setTestingUrl] = useState<ufo.ParsedURL>();

  const serverRoute = useMemo(
    () =>
      testingUrl &&
      serverRoutes.find(
        route =>
          testingUrl.pathname === route.urlPath ||
          testingUrl.pathname.startsWith(`${route.urlPath}/`),
      ),
    [testingUrl],
  );
  const fileSystemRoute =
    (serverRoute?.entryName &&
      serverRoute.entryName in fileSystemRoutes &&
      fileSystemRoutes[serverRoute.entryName]) ||
    null;

  const matchedRoutes = useMemo(() => {
    const routes = fileSystemRoute;
    if (!testingUrl || !routes) {
      return null;
    }
    const _url = ufo
      .stringifyParsedURL(testingUrl)
      .replace(`${serverRoute!.entryName!}/`, '');
    if (isLegacyRoutes(routes)) {
      return matchLegacyRoutes(routes, _url);
    } else {
      return matchRoutes(routes as any, _url);
    }
  }, [fileSystemRoute, testingUrl]);
  console.log('matchedRoutes: ', matchedRoutes);

  return (
    <Container>
      <TextField.Root>
        <TextField.Slot>
          <Text size="2">test:</Text>
        </TextField.Slot>
        <TextField.Input
          placeholder="/foo?bar#baz"
          onChange={e => setTestingUrl(ufo.parseURL(e.target.value))}
        />
      </TextField.Root>
      <Box height="2" />
      <RoutesContainer>
        {serverRoutes.map(route => (
          <ServerRoute key={route.entryPath} route={route} />
        ))}
      </RoutesContainer>
    </Container>
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
