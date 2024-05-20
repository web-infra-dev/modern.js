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
import { $serverExported, VERSION } from '../state';
import '@/components/Card/Card.module.scss';
import styles from './page.module.scss';
import { Card, CardColumn } from '@/components/Card';

const BUNDLER_PACKAGE_NAMES = {
  webpack: 'webpack',
  rspack: '@rspack/core',
} as const;

const Page: React.FC = () => {
  const frameworkContext = useSnapshot($serverExported.framework).context;
  const { def } = useSnapshot($serverExported).context;
  const dependencies = useSnapshot($serverExported.dependencies);
  const builderContext = useSnapshot($serverExported.builder).context;
  const { compileDuration } = useSnapshot($serverExported).performance;
  const isMacOS = window.navigator.userAgent.includes('Mac OS');
  const { toolsType } = frameworkContext;
  if (toolsType !== 'app-tools') {
    throw Error();
  }
  const toolsPackage = def.packages.appTools;
  const toolsPackageVer = dependencies[toolsPackage]!;

  const { bundlerType } = builderContext;
  const bundlerPackage = BUNDLER_PACKAGE_NAMES[bundlerType];
  const bundlerPackageVer = dependencies[bundlerPackage];

  // const numFrameworkPlugin = store.framework.config.transformed.plugins.length;

  return (
    <Flex direction="column" align="center">
      <Flex
        wrap="wrap"
        gap="4"
        mb="8"
        justify="center"
        className={styles.container}
      >
        <Card variant="indicate" className={styles.primaryCard}>
          <Theme appearance="dark" hasBackground={false} asChild>
            <CardColumn>
              <Heading as="h1" className={styles.heading}>
                DevTools
              </Heading>
              <Flex gap="2">
                <button type="button">v{VERSION}</button>
              </Flex>
              <Text as="p" size="1">
                Powered by {toolsPackage}@{toolsPackageVer}
              </Text>
            </CardColumn>
          </Theme>
        </Card>
        <Card variant="indicate" className={styles.infoCard}>
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
        </Card>
        <Card variant="indicate" className={styles.pluginCard}>
          <Flex align="center" justify="between" height="100%" gap="6">
            <Box>
              <Text
                as="p"
                size="8"
                weight="bold"
                style={{ color: 'var(--gray-11)' }}
                mb="2"
              >
                {frameworkContext.plugins.length}
              </Text>
              <Text as="p" size="1" color="gray">
                Framework Plugins
              </Text>
            </Box>
            <HiOutlinePuzzlePiece size="50" color="var(--gray-6)" />
          </Flex>
        </Card>
        <Card variant="indicate" className={styles.compileTimeCard}>
          <Flex align="center" justify="between" height="100%" gap="6">
            <Box>
              <Text
                as="p"
                size="8"
                weight="bold"
                style={{ color: 'var(--gray-11)' }}
              >
                {(compileDuration / 1000).toFixed(2)}s
              </Text>
              <Text as="p" size="1" color="gray">
                Compiled in {bundlerPackage}@{bundlerPackageVer}
              </Text>
            </Box>
            <HiOutlineClock size="50" color="var(--gray-6)" />
          </Flex>
        </Card>
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
