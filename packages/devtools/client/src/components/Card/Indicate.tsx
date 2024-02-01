import clsx from 'clsx';
import { Box } from '@radix-ui/themes';
import type { BoxProps } from '@radix-ui/themes/dist/cjs/components/box';
import styles from './Indicate.module.scss';

export type IndicateCardProps = BoxProps & React.RefAttributes<HTMLDivElement>;

export const IndicateCard: React.FC<IndicateCardProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <Box {...props} className={clsx(styles.indicateCard, className)}>
      {children}
    </Box>
  );
};
