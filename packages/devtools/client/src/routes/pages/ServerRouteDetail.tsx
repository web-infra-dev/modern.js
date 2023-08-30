import React from 'react';
import { ServerRoute } from '@modern-js/types';
import styled from '@emotion/styled';
import { Box } from '@radix-ui/themes';
import EntryView from './EntryView';

export interface ServerRouteDetailProps {
  route: ServerRoute;
}

export const ServerRouteDetail: React.FC<ServerRouteDetailProps> = ({
  route,
}) => {
  if (route.entryName) {
    return (
      <Container>
        <EntryView route={route} />
      </Container>
    );
  } else {
    throw new Error('Unimplemented.');
  }
};

const Container = styled(Box)({
  padding: 'var(--space-2) 0',
});
