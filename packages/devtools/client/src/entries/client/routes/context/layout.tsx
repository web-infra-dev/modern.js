import { Outlet } from '@modern-js/runtime/router';
import { Box } from '@radix-ui/themes';

export default function Layout() {
  return (
    <Box px="4">
      <Outlet />
    </Box>
  );
}
