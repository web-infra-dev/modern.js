import React, { useContext, useState } from 'react';
import type { ServerRoute as IServerRoute } from '@modern-js/types';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Box, Text } from '@radix-ui/themes';
import { CaretSortIcon } from '@radix-ui/react-icons';
import styles from './Base.module.scss';
import { MatchUrlContext } from './Context';

export interface BaseRouteProps extends React.PropsWithChildren {
  badge: React.ReactElement;
  route: IServerRoute;
  title: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const BaseRoute: React.FC<BaseRouteProps> = ({
  badge,
  route,
  title,
  children,
  open,
  onOpenChange,
}) => {
  const { matched } = useContext(MatchUrlContext);
  const [_open, _setOpen] = useState(false);

  const isMatching = Boolean(matched);
  const isMatched = matched === route;
  const isOpen = isMatched || (open ?? _open);

  return (
    <Box p="3" className={styles.container}>
      <Collapsible.Root open={isOpen} onOpenChange={onOpenChange ?? _setOpen}>
        <Collapsible.Trigger className={styles.trigger}>
          {badge}
          <Text
            className={styles.urlText}
            style={{ opacity: isMatching && !isMatched ? 0.5 : 1 }}
          >
            {title}
          </Text>
          <Box flexGrow="1" />
          <Box className={styles.mark} data-open={isOpen}>
            <CaretSortIcon />
          </Box>
        </Collapsible.Trigger>
        <Collapsible.Content className={styles.content}>
          {children}
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};
