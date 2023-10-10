import { Suspense } from 'react';
import { Outlet } from '@modern-js/runtime/router';
import { Box, ScrollArea } from '@radix-ui/themes';
import styled from '@emotion/styled';

export default function Layout() {
  return (
    <Container>
      <Box grow="1" asChild>
        <ScrollArea scrollbars="both">
          <Suspense fallback={'loading...'}>
            <Outlet />
          </Suspense>
        </ScrollArea>
      </Box>
    </Container>
  );
}

const Container = styled(Box)({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
});
