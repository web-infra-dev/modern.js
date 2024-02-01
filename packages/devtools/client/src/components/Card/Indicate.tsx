import { FC } from 'react';
import clsx from 'clsx';
import { Box, Flex } from '@radix-ui/themes';
import type { BoxProps } from '@radix-ui/themes/dist/cjs/components/box';
import type { FlexProps } from '@radix-ui/themes/dist/cjs/components/flex';
import styles from './Indicate.module.scss';

export type IndicateCardProps = BoxProps & React.RefAttributes<HTMLDivElement>;

const Card: FC<IndicateCardProps> = ({ children, className, ...props }) => {
  return (
    <Box {...props} className={clsx(styles.indicateCard, className)}>
      {children}
    </Box>
  );
};

const Column: FC<FlexProps> = props => (
  <Flex
    gap="2"
    height="100%"
    justify="center"
    direction="column"
    align="start"
    {...props}
  />
);

export const IndicateCard = Object.assign(Card, {
  Column,
});
