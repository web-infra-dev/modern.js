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
        <Box width="5" height="5" asChild>
          {tab.icon}
        </Box>
      </NavLink>
    </Tooltip>
  );
};

const Navigator: React.FC = () => {
  const { tabs } = useStoreSnapshot();

  return (
    <Flex direction="column" className={styles.navigator}>
      {tabs.map(tab => (
        <NavigateButton key={tab.name} tab={tab as any} />
      ))}
    </Flex>
  );
};

export default function Layout() {
  return (
    <StoreContextProvider>
      <Theme panelBackground="solid">
        {process.env.NODE_ENV === 'development' && (
          <ThemePanel defaultOpen={false} />
        )}
        <Flex align="stretch" className={styles.container}>
          <Navigator />
          <Box grow="1">
            <Breadcrumbs />
            <Box position="relative" height="100%">
              <Outlet />
              <Box height="6" className={styles.fadingMask} />
            </Box>
          </Box>
        </Flex>
      </Theme>
    </StoreContextProvider>
  );
}
