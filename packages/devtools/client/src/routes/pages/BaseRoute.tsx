import React, { useContext, useState } from 'react';
import type { ServerRoute as IServerRoute } from '@modern-js/types';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Box, Card, Text } from '@radix-ui/themes';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { parseURL } from 'ufo';
import styled from '@emotion/styled';
import { MatchUrlContext } from './MatchUrl';

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
  const url = useContext(MatchUrlContext);
  const [_open, _setOpen] = useState(false);
  const isMatching = Boolean(url);
  const { pathname } = parseURL(url);
  const isMatched =
    pathname === route.urlPath || pathname.startsWith(`${route.urlPath}/`);
  const isOpen = isMatched || (open ?? _open);

  return (
    <Container>
      <Collapsible.Root open={isOpen} onOpenChange={onOpenChange ?? _setOpen}>
        <CollapsibleTrigger>
          {badge}
          <UrlText data-miss-matched={isMatching && !isMatched}>
            {title}
          </UrlText>
          <Box grow="1" />
          <CollapsedMark open={isOpen}>
            <CaretSortIcon />
          </CollapsedMark>
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </Collapsible.Root>
    </Container>
  );
};

const Container = styled(Card)({
  backgroundColor: '#181818',
});

const CollapsibleTrigger = styled(Collapsible.Trigger)({
  all: 'unset',
  width: '100%',
  display: 'flex',
  gap: 'var(--space-2)',
  alignItems: 'center',
});

const CollapsibleContent = styled(Collapsible.Content)({
  paddingTop: 'var(--space-2)',
});

const UrlText = styled(Text)({
  color: 'var(--gray-12)',
  fontSize: 'var(--font-size-2)',
  transition: 'color 200ms',
  '&[data-miss-matched="true"]': {
    color: 'var(--gray-10)',
  },
});

const CollapsedMark = styled(Box)<{ open?: boolean }>(props => ({
  backgroundColor: props.open ? 'var(--gray-4)' : 'transparent',
  height: 'var(--font-size-5)',
  width: 'var(--font-size-5)',
  borderRadius: 'var(--radius-2)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'background-color 100ms',
}));
