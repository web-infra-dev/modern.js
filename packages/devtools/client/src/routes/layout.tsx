import './layout.css';
import React from 'react';
import { NavLink, Outlet } from '@modern-js/runtime/router';
import { Box, Flex, ThemePanel, Tooltip } from '@radix-ui/themes';
import styles from './layout.module.scss';
import { StoreContextProvider, useStoreSnapshot } from '@/stores';
import { Theme } from '@/components/Theme';
import { InternalTab } from '@/types';
import { Breadcrumbs } from '@/components/Breadcrumbs';

const NavigateButton: React.FC<{ tab: InternalTab }> = ({ tab }) => {
  let to = '';
  if (tab.view.type === 'builtin') {
    to = tab.view.url;
  } else if (tab.view.type === 'iframe') {
    to = `/external/${tab.view.src}`;
  } else {
    throw new Error(`Invalid tab view of "${tab.name}".`);
  }

  return (
    <Tooltip content={tab.title} side="right">
      <NavLink to={to} className={styles.tabButton}>
        <Flex
          justify="center"
          align="center"
          p="1"
          className={styles.tabButtonInner}
        >
          <Box height="5" width="5" asChild>
            {tab.icon}
          </Box>
        </Flex>
      </NavLink>
    </Tooltip>
  );
};

const Navigator: React.FC = () => {
  const { tabs } = useStoreSnapshot();

  return (
    <Flex direction="column" shrink="0" className={styles.navigator}>
      {tabs.map(tab => (
        <NavigateButton key={tab.name} tab={tab as any} />
      ))}
    </Flex>
  );
};

export default function Layout() {
  return (
    <StoreContextProvider>
      <Theme
        className={styles.wrapper}
        accentColor="blue"
        panelBackground="solid"
      >
        <Box className={styles.inner}>
          <Box className={styles.innerRight}>
            <Box className={styles.container}>
              <Outlet />
            </Box>
          </Box>
        </Box>
        {process.env.NODE_ENV === 'development' && (
          <ThemePanel defaultOpen={false} />
        )}
        <Navigator />
        <Breadcrumbs className={styles.breadcrumbs} />
      </Theme>
    </StoreContextProvider>
  );
}
