import { Outlet } from '@modern-js/runtime/router';
import { Box } from '@radix-ui/themes';

export default function Layout() {
  return (
    <Box width="100%" height="100%" pt="6" style={{ overflowY: 'scroll' }}>
      <Outlet />
    </Box>
  );
}
