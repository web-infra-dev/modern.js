import type { FC } from 'react';
import { Box } from '@radix-ui/themes';
import type { BoxProps } from '@radix-ui/themes/dist/cjs/components/box';
import { LoadingIcon } from './Icon';
import styles from './Loading.module.scss';

export type LoadingProps = BoxProps;

export const Loading: FC<LoadingProps> = props => {
  return (
    <Box className={styles.container} {...props}>
      <LoadingIcon />
    </Box>
  );
};
