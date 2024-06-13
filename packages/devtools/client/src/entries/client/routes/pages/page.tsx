import { Box, Flex, TextField } from '@radix-ui/themes';
import React, { useState } from 'react';
import { parseURL, withTrailingSlash } from 'ufo';
import { HiOutlineArrowsRightLeft } from 'react-icons/hi2';
import { useSnapshot } from 'valtio';
import styles from './page.module.scss';
import { useGlobals } from '@/entries/client/globals';
import {
  MatchServerRouteValue,
  MatchUrlContext,
} from '@/components/ServerRoute/Context';
import { ServerRoute } from '@/components/ServerRoute/Route';

const Page: React.FC = () => {
  const $globals = useGlobals();
  const { serverRoutes } = useSnapshot($globals.framework).context;

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
    <>
      <Flex
        className={styles.list}
        direction="column"
        gap="2"
        align="stretch"
        justify="between"
        mx="auto"
      >
        <MatchUrlContext.Provider value={matchContext}>
          {serverRoutes.map(route => (
            <ServerRoute key={route.entryPath} route={route} />
          ))}
        </MatchUrlContext.Provider>
      </Flex>
      <Box className={styles.input}>
        <Box mx="auto" style={{ maxWidth: '40rem' }}>
          <TextField.Root
            placeholder="/foo?bar#baz"
            onChange={e => handleUrlInput(e.target.value)}
            type="url"
            autoComplete="false"
            autoCapitalize="false"
            autoCorrect="false"
          >
            <TextField.Slot>
              <HiOutlineArrowsRightLeft />
            </TextField.Slot>
          </TextField.Root>
        </Box>
      </Box>
    </>
  );
};

export default Page;
