import React from 'react';
import { ServerRoute } from '@modern-js/types';
import styled from '@emotion/styled';
import { Box, Text } from '@radix-ui/themes';
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
    return <Text>Unknown route type.</Text>;
  }
};

const Container = styled(Box)({
  padding: '0 var(--space-2)',
  marginTop: 'var(--space-3)',
});
