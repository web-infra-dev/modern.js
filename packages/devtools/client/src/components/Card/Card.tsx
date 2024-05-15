import { FC } from 'react';
import clsx from 'clsx';
import { Box, Flex } from '@radix-ui/themes';
import type { BoxProps } from '@radix-ui/themes/dist/cjs/components/box';
import type { FlexProps } from '@radix-ui/themes/dist/cjs/components/flex';
import styles from './Card.module.scss';

export interface CardProps
  extends Omit<BoxProps, 'inset'>,
    React.RefAttributes<HTMLDivElement> {
  variant?: 'indicate' | 'small';
  clickable?: boolean;
  selected?: boolean;
  inset?: boolean;
}

export const Card: FC<CardProps> = props => {
  const {
    children,
    className,
    variant,
    clickable = false,
    selected = false,
    inset = false,
    ...rest
  } = props;
  return (
    <Box
      {...rest}
      data-variant={variant ?? ''}
      data-clickable={clickable}
      data-selected={selected}
      data-inset={inset}
      className={clsx(styles.card, className)}
    >
      {children}
    </Box>
  );
};

export const CardColumn: FC<FlexProps> = props => (
  <Flex
    gap="2"
    height="100%"
    justify="center"
    direction="column"
    align="start"
    {...props}
  />
);
