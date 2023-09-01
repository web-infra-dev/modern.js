import styled from '@emotion/styled';
import { Box, Text, TextField } from '@radix-ui/themes';
import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import { MatchUrlContext } from './MatchUrl';
import { ServerRoute } from './ServerRoute';
import { useStore } from '@/stores';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { serverRoutes } = store.framework.context;

  const [testingUrl, setTestingUrl] = useState<string>('');

  return (
    <MatchUrlContext.Provider value={testingUrl}>
      <Container>
        <Box>
          <TextField.Root>
            <TextField.Slot>
              <Text size="2">test:</Text>
            </TextField.Slot>
            <TextField.Input
              placeholder="/foo?bar#baz"
              onChange={e => setTestingUrl(e.target.value)}
              type="search"
              autoComplete="false"
              autoCapitalize="false"
              autoCorrect="false"
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
