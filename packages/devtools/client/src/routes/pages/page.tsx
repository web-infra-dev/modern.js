import { Box, Flex, TextField } from '@radix-ui/themes';
import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import { HiOutlineArrowsRightLeft } from 'react-icons/hi2';
import { useStore } from '@/stores';
import { MatchUrlContext } from '@/components/ServerRoute/Context';
import { ServerRoute } from '@/components/ServerRoute/Route';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { serverRoutes } = store.framework.context;

  const [testingUrl, setTestingUrl] = useState<string>('');

  return (
    <MatchUrlContext.Provider value={testingUrl}>
      <Box mb="2">
        <TextField.Root>
          <TextField.Slot>
            <HiOutlineArrowsRightLeft />
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
      <Flex direction="column" gap="2" align="stretch" justify="between">
        {serverRoutes.map(route => (
          <ServerRoute key={route.entryPath} route={route} />
        ))}
      </Flex>
    </MatchUrlContext.Provider>
  );
};

export default Page;
