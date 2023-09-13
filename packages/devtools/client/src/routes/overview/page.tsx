import React from 'react';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import {
  ArchiveIcon,
  CubeIcon,
  MixIcon,
  GlobeIcon,
} from '@radix-ui/react-icons';
import { useSnapshot } from 'valtio';
import styled from '@emotion/styled';
import srcHeading from './heading.svg';
import { useStore } from '@/stores';

const BUNDLER_PACKAGE_NAMES = {
  webpack: 'webpack',
  rspack: '@rspack/core',
} as const;

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
  const bundlerVer = store.dependencies[BUNDLER_PACKAGE_NAMES[bundlerType]];

  const numFrameworkPlugin = store.framework.config.transformed.plugins.length;

  return (
    <Flex direction="column" align="center">
      <Flex gap="2">
        <img src={store.assets.logo} />
        <LogoHeading src={srcHeading} />
      </Flex>
      <Description>
        {store.name.formalName} DevTools v{store.version}
      </Description>
      <Flex wrap="wrap" gap="3" mt="7" width="100%" justify="center">
        <Box>
          <Indicator icon={<ArchiveIcon width="36" height="36" color="gray" />}>
            Compiled with {(store.compileTimeCost / 1000).toFixed(2)}s
          </Indicator>
        </Box>
        <Box>
          <Indicator
            title="Tools"
            icon={<CubeIcon width="36" height="36" color="gray" />}
          >
            <Text color="gray" size="2">
              <Box>
                {toolsType}@{toolsPackageVer}
              </Box>
              <Box>
                {bundlerType}@{bundlerVer}
              </Box>
              <Box>react@{store.dependencies.react}</Box>
            </Text>
          </Indicator>
        </Box>
        <Box>
          <Indicator
            title="Plugin"
            icon={<MixIcon width="36" height="36" color="gray" />}
          >
            <Box>
              <Text size="2" color="gray">
                {numFrameworkPlugin} framework plugins
              </Text>
            </Box>
            <Box>
              <Text size="2" color="gray">
                {store.framework.context.plugins.length} builder plugins
              </Text>
            </Box>
          </Indicator>
        </Box>
        <Box>
          <Indicator icon={<GlobeIcon width="36" height="36" color="gray" />}>
            {store.framework.context.serverRoutes.length} Endpoints
          </Indicator>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Page;

interface IndicatorProps extends React.PropsWithChildren {
  title?: string;
  icon: React.ReactElement;
}

const Indicator: React.FC<IndicatorProps> = ({ title, icon, children }) => {
  return (
    <Card>
      <Flex gap="4" p="2">
        <Flex align="center" direction="column" gap="1">
          {icon}
          <Text size="1" color="gray">
            {title ?? children}
          </Text>
        </Flex>
        {title && <Box>{children}</Box>}
      </Flex>
    </Card>
  );
};

const Description = styled(Text)({
  fontSize: 'var(--font-size-1)',
  color: 'var(--gray-7)',
});

const LogoHeading = styled.img({
  width: '10rem',
});
