import { Box, Flex, Kbd, Link, Text, Theme } from '@radix-ui/themes';
import type { BoxProps } from '@radix-ui/themes/dist/cjs/components/box';
import { clsx } from 'clsx';
import React from 'react';
import {
  HiOutlineDocumentText,
  HiLink,
  HiOutlineClock,
  HiOutlinePuzzlePiece,
} from 'react-icons/hi2';
import { parseURL } from 'ufo';
import { useSnapshot } from 'valtio';
import srcHeading from './heading.svg';
import styles from './page.module.scss';
import { useStore } from '@/entries/client/stores';

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
  const isMacOS = window.navigator.userAgent.includes('Mac OS');
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
      <Flex
        wrap="wrap"
        gap="4"
        mb="8"
        justify="center"
        className={styles.container}
      >
        <IndicateCard className={styles.primaryCard}>
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
                <button type="button">v{store.version}</button>
              </Flex>
              <Text as="p" size="1">
                Powered by {toolsPackage}@{toolsPackageVer}
              </Text>
            </Flex>
          </Theme>
        </IndicateCard>
        <IndicateCard className={styles.infoCard}>
          <Flex justify="between" gap="3" align="center" height="100%">
            <Box>
              <Text color="gray">Visit our website</Text>
              <Flex align="center" asChild>
                <Link
                  href={store.announcement.fallback}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <HiLink />
                  <Text>{parseURL(store.announcement.fallback).host}</Text>
                </Link>
              </Flex>
            </Box>
            <Box color="gray" asChild>
              <HiOutlineDocumentText size="50" color="var(--gray-6)" />
            </Box>
          </Flex>
        </IndicateCard>
        <IndicateCard className={styles.pluginCard}>
          <Flex align="center" justify="between" height="100%" gap="6">
            <Box>
              <Text
                as="p"
                size="8"
                weight="bold"
                style={{ color: 'var(--gray-11)' }}
                mb="2"
              >
                {store.framework.context.plugins.length}
              </Text>
              <Text as="p" size="1" color="gray">
                Framework Plugins
              </Text>
            </Box>
            <HiOutlinePuzzlePiece size="50" color="var(--gray-6)" />
          </Flex>
        </IndicateCard>
        <IndicateCard className={styles.compileTimeCard}>
          <Flex align="center" justify="between" height="100%" gap="6">
            <Box>
              <Text
                as="p"
                size="8"
                weight="bold"
                style={{ color: 'var(--gray-11)' }}
              >
                {(store.compileTimeCost / 1000).toFixed(2)}s
              </Text>
              <Text as="p" size="1" color="gray">
                Compiled in {bundlerPackage}@{bundlerPackageVer}
              </Text>
            </Box>
            <HiOutlineClock size="50" color="var(--gray-6)" />
          </Flex>
        </IndicateCard>
      </Flex>
      <Flex align="center" className={styles.bottomTip}>
        <Text color="gray" size="2">
          Use
        </Text>
        <Kbd mx="2">Shift + {isMacOS ? 'Opt' : 'Alt'} + D</Kbd>
        <Text color="gray" size="2">
          to open DevTools
        </Text>
      </Flex>
    </Flex>
  );
};

export default Page;
