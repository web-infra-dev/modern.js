import { Suspense } from 'react';
import { Outlet } from '@modern-js/runtime/router';
import { Box, ScrollArea } from '@radix-ui/themes';
import styled from '@emotion/styled';

export default function Layout() {
  return (
    <Container>
      <ScrollArea scrollbars="both">
        <Suspense fallback={'loading...'}>
          <Outlet />
        </Suspense>
      </ScrollArea>
    </Container>
  );
}

const Container = styled(Box)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
});
