import React, { useState } from 'react';
import type { ServerRoute as IServerRoute } from '@modern-js/types';
import * as Collapsible from '@radix-ui/react-collapsible';
import { Box, Card, Text, Badge } from '@radix-ui/themes';
import { CaretSortIcon } from '@radix-ui/react-icons';
import styled from '@emotion/styled';
import { ServerRouteDetail } from './ServerRouteDetail';

export interface ServerRouteProps {
  route: IServerRoute;
}

export type ServerRouteType = 'entry' | 'api';

export const ServerRoute: React.FC<ServerRouteProps> = ({ route }) => {
  const [open, setOpen] = useState(false);
  const type: ServerRouteType = route.isApi ? 'api' : 'entry';

  return (
    <Container>
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger>
          {TYPE_BADGES[type]}
          <UrlText>{route.urlPath}</UrlText>
          <Box grow="1" />
          <CollapsedMark open={open}>
            <CaretSortIcon />
          </CollapsedMark>
        </CollapsibleTrigger>
        <Collapsible.Content>
          <ServerRouteDetail route={route} />
        </Collapsible.Content>
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

const UrlText = styled(Text)({
  color: 'var(--gray-12)',
  fontSize: 'var(--font-size-2)',
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

const TYPE_BADGES = {
  api: <Badge color="pink">API</Badge>,
  entry: <Badge color="cyan">Entry</Badge>,
};
