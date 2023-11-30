import { Box, Flex, TextField } from '@radix-ui/themes';
import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import { parseURL, withTrailingSlash } from 'ufo';
import { HiOutlineArrowsRightLeft } from 'react-icons/hi2';
import styles from './page.module.scss';
import { useStore } from '@/entries/client/stores';
import {
  MatchServerRouteValue,
  MatchUrlContext,
} from '@/components/ServerRoute/Context';
import { ServerRoute } from '@/components/ServerRoute/Route';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { serverRoutes } = store.framework.context;

  const [matchContext, setMatchContext] = useState<MatchServerRouteValue>({
    url: '',
  });
  const handleUrlInput = (url: string) => {
    const { pathname } = parseURL(url);
    const matched = serverRoutes.find(
      route =>
        pathname === route.urlPath ||
        pathname.startsWith(withTrailingSlash(route.urlPath)),
    );
    setMatchContext({ url, matched });
  };

  return (
    <MatchUrlContext.Provider value={matchContext}>
      <Flex
        position="relative"
        direction="column"
        gap="2"
        align="stretch"
        justify="between"
        pt="8"
      >
        {serverRoutes.map(route => (
          <ServerRoute key={route.entryPath} route={route} />
        ))}
        <Box mb="2" className={styles.input}>
          <Box
            style={{
              maxWidth: '40rem',
              margin: '0 auto',
              padding: '0 var(--space-4)',
            }}
          >
            <TextField.Root>
              <TextField.Slot>
                <HiOutlineArrowsRightLeft />
              </TextField.Slot>
              <TextField.Input
                placeholder="/foo?bar#baz"
                onChange={e => handleUrlInput(e.target.value)}
                type="url"
                autoComplete="false"
                autoCapitalize="false"
                autoCorrect="false"
              />
            </TextField.Root>
          </Box>
        </Box>
      </Flex>
    </MatchUrlContext.Provider>
  );
};

export default Page;
