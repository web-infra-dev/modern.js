import { Suspense } from 'react';
import { Outlet, useNavigate } from '@modern-js/runtime/router';
import { Box, ScrollArea, Select } from '@radix-ui/themes';
import styled from '@emotion/styled';

export default function Layout() {
  const navigate = useNavigate();
  const handleSelect = (route: string) => {
    navigate(route);
  };
  return (
    <Container>
      <Box grow="0">
        <Select.Root onValueChange={handleSelect} defaultValue="builder">
          <Select.Trigger />
          <Select.Content position="popper">
            <Select.Item value="framework">Framework Context</Select.Item>
            <Select.Item value="builder">Builder Context</Select.Item>
          </Select.Content>
        </Select.Root>
      </Box>
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
