import React, { PropsWithChildren } from 'react';
import { Box, Flex, Heading } from '@radix-ui/themes';
import { HiExclamationCircle } from 'react-icons/hi2';
import styles from './FeatureDisabled.module.scss';

export interface FeatureDisabledProps extends PropsWithChildren {
  title: string;
}

export const FeatureDisabled: React.FC<FeatureDisabledProps> = props => {
  const { title, children } = props;
  return (
    <Flex className={styles.container} mt="9" mx="auto" gap="2">
      <Flex height="var(--space-9)" align="center">
        <HiExclamationCircle size="36" />
      </Flex>
      <Box>
        <Flex height="var(--space-9)" align="center">
          <Heading>{title}</Heading>
        </Flex>
        <Box className={styles.children}>{children}</Box>
      </Box>
    </Flex>
  );
};
