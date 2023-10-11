import { Box, Flex, Heading, Link, Text, Theme } from '@radix-ui/themes';
import type { BoxProps } from '@radix-ui/themes/dist/cjs/components/box';
import { clsx } from 'clsx';
import React from 'react';
import { HiClock, HiMiniNewspaper } from 'react-icons/hi2';
import { useSnapshot } from 'valtio';
import srcHeading from './heading.svg';
import styles from './page.module.scss';
import { useStore } from '@/stores';

const BUNDLER_PACKAGE_NAMES = {
  webpack: 'webpack',
  rspack: '@rspack/core',
} as const;

const IndicateCard: React.FC<
  BoxProps & React.RefAttributes<HTMLDivElement>
> = ({ children, className, ...props }) => {
  return (
    <Box {...props} className={clsx(styles.indicateCard, className)}>
      {children}
    </Box>
  );
};

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { toolsType } = store.framework.context;
  if (toolsType !== 'app-tools') {
    throw Error();
  }
  const toolsPackage = store.packages.appTools;
  const toolsPackageVer = store.dependencies[toolsPackage]!;

  const { bundlerType } = store.builder.context;
  const bundlerPackage = BUNDLER_PACKAGE_NAMES[bundlerType];
  const bundlerPackageVer = store.dependencies[bundlerPackage];

  // const numFrameworkPlugin = store.framework.config.transformed.plugins.length;

  return (
    <Flex direction="column" align="center" p="4">
      <Flex wrap="wrap" gap="4" justify="center" className={styles.container}>
        <IndicateCard grow="1" className={styles.primaryCard}>
          <Theme appearance="dark" hasBackground={false} asChild>
            <Flex
              gap="2"
              height="100%"
              justify="center"
              direction="column"
              align="start"
            >
              <img src={srcHeading} style={{ width: '8rem' }} />
              <Flex gap="2">
                <button type="button">v2.35.1</button>
              </Flex>
              <Text as="p" size="1">
                Powered by {toolsPackage}@{toolsPackageVer}
              </Text>
            </Flex>
          </Theme>
        </IndicateCard>
        <IndicateCard grow={{ initial: '1', sm: '0' }}>
          <Flex direction="column" justify="center" height="100%">
            <Flex align="center" gap="2" mb="3">
              <HiClock size="2.5rem" color="var(--gray-6)" />
              <Text
                as="p"
                size="8"
                weight="bold"
                style={{ color: 'var(--gray-11)' }}
              >
                6.25s
              </Text>
            </Flex>
            <Text as="p" size="1" color="gray">
              Compiled in {bundlerPackage}@{bundlerPackageVer}
            </Text>
          </Flex>
        </IndicateCard>
        <IndicateCard grow="1" style={{ minWidth: '15rem' }}>
          <Heading as="h2" size="5">
            Load & Render
          </Heading>
          <Text
            as="p"
            weight="bold"
            size="8"
            my="3"
            style={{ color: 'var(--gray-11)' }}
          >
            4.47s
          </Text>
          <Flex gap="1">
            <Box className={styles.indicateBar}>Request</Box>
            <Box className={styles.indicateBar}>SSR</Box>
            <Box className={styles.indicateBar}>LCP</Box>
            <Box className={styles.indicateBar}>Render</Box>
          </Flex>
        </IndicateCard>
        <IndicateCard
          grow={{ initial: '1', sm: '0' }}
          style={{ minWidth: '15rem' }}
        >
          <Heading as="h2" size="5" mb="3">
            Announcements
          </Heading>
          <Flex direction="column" width="100%" gap="1">
            <Flex align="center" gap="4">
              <Box width="1">
                <HiMiniNewspaper />
              </Box>
              <Link color="gray">Introduction to EdenX DevTools</Link>
            </Flex>
            <Flex align="center" gap="4">
              <Box width="1">
                <HiMiniNewspaper />
              </Box>
              <Link color="gray">Introduction to Rspress 1.0</Link>
            </Flex>
          </Flex>
        </IndicateCard>
      </Flex>
    </Flex>
  );
};

export default Page;
