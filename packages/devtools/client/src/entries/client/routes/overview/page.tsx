import { Box, Flex, Heading, Kbd, Link, Text, Theme } from '@radix-ui/themes';
import React from 'react';
import {
  HiLink,
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlinePuzzlePiece,
} from 'react-icons/hi2';
import { parseURL } from 'ufo';
import { useSnapshot } from 'valtio';
import {
  $builder,
  $definition,
  $dependencies,
  $framework,
  $perf,
  VERSION,
} from '../state';
import '@/components/Card/Indicate.module.scss';
import styles from './page.module.scss';
import { IndicateCard } from '@/components/Card';

const BUNDLER_PACKAGE_NAMES = {
  webpack: 'webpack',
  rspack: '@rspack/core',
} as const;

const Page: React.FC = () => {
  const framework = useSnapshot($framework);
  const def = useSnapshot($definition);
  const dependencies = useSnapshot($dependencies);
  const builder = useSnapshot($builder);
  const perf = useSnapshot($perf);
  const isMacOS = window.navigator.userAgent.includes('Mac OS');
  const { toolsType } = framework.context;
  if (toolsType !== 'app-tools') {
    throw Error();
  }
  const toolsPackage = def.packages.appTools;
  const toolsPackageVer = dependencies[toolsPackage]!;

  const { bundlerType } = builder.context;
  const bundlerPackage = BUNDLER_PACKAGE_NAMES[bundlerType];
  const bundlerPackageVer = dependencies[bundlerPackage];

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
            <IndicateCard.Column>
              <Heading as="h1" className={styles.heading}>
                DevTools
              </Heading>
              <Flex gap="2">
                <button type="button">v{VERSION}</button>
              </Flex>
              <Text as="p" size="1">
                Powered by {toolsPackage}@{toolsPackageVer}
              </Text>
            </IndicateCard.Column>
          </Theme>
        </IndicateCard>
        <IndicateCard className={styles.infoCard}>
          <Flex justify="between" gap="3" align="center" height="100%">
            <Box>
              <Text color="gray">Visit our website</Text>
              <Flex align="center" asChild>
                <Link
                  href={def.announcement.fallback}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <HiLink />
                  <Text>{parseURL(def.announcement.fallback).host}</Text>
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
                {framework.context.plugins.length}
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
                {(perf.compileDuration / 1000).toFixed(2)}s
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
