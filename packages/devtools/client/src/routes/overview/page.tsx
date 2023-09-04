import './page.css';
import React from 'react';
import { Box, Card, Flex, Heading, Text } from '@radix-ui/themes';
import {
  ArchiveIcon,
  CubeIcon,
  MixIcon,
  GlobeIcon,
} from '@radix-ui/react-icons';
import { useSnapshot } from 'valtio';
import styled from '@emotion/styled';
import srcLogo from './logo.svg';
import { useStore } from '@/stores';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { toolsType } = store.framework.context;
  const { bundlerType } = store.builder.context;
  const numFrameworkPlugin = store.framework.config.transformed.plugins.length;

  return (
    <Flex direction="column" align="center">
      <Flex gap="2">
        <img src={srcLogo} />
        <Heading as="h1" my="4" size="8" weight="medium" color="sky">
          <LogoText>DevTools</LogoText>
        </Heading>
      </Flex>
      <Description>
        {store.name.formalName} DevTools v{store.version}
      </Description>
      <Flex wrap="wrap" gap="3" mt="4" width="100%" justify="center">
        <Box>
          <Indicator icon={<CubeIcon width="36" height="36" color="gray" />}>
            {toolsType}
          </Indicator>
        </Box>
        <Box>
          <Indicator icon={<ArchiveIcon width="36" height="36" color="gray" />}>
            {bundlerType}
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
            {title ? title : children}
          </Text>
        </Flex>
        {title && <Box>{children}</Box>}
      </Flex>
    </Card>
  );
};

const LogoText = styled(Text)({
  fontFamily: 'Open Sans, cursive',
  fontWeight: 800,
  color: 'white',
});

const Description = styled(Text)({
  fontSize: 'var(--font-size-1)',
  color: 'var(--gray-7)',
});
