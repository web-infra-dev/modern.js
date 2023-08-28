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
        <Select.Root
          onValueChange={handleSelect}
          defaultValue="builder/transformed"
        >
          <Select.Trigger />
          <Select.Content position="popper">
            <Select.Group>
              <Select.Label>Framework</Select.Label>
              <Select.Item value="framework/resolved">
                Resolved Framework Config
              </Select.Item>
              <Select.Item value="framework/transformed">
                Transformed Framework Config
              </Select.Item>
            </Select.Group>
            <Select.Separator />
            <Select.Group>
              <Select.Label>Builder</Select.Label>
              <Select.Item value="builder/resolved">
                Resolved Builder Config
              </Select.Item>
              <Select.Item value="builder/transformed">
                Transformed Builder Config
              </Select.Item>
            </Select.Group>
            <Select.Separator />
            <Select.Group>
              <Select.Label>Bundler</Select.Label>
              <Select.Item value="bundler/resolved">
                Resolved Bundler Configs
              </Select.Item>
              <Select.Item value="bundler/transformed">
                Transformed Bundler Configs
              </Select.Item>
            </Select.Group>
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
