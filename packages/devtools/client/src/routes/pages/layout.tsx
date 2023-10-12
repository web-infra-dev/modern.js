import { Outlet } from '@modern-js/runtime/router';
import { Box } from '@radix-ui/themes';
import styles from './layout.module.scss';

export default function Layout() {
  return (
    <Box px="4" mx="auto" className={styles.container}>
      <Outlet />
    </Box>
  );
}
