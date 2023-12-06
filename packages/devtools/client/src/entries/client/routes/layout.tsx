import '@/styles/theme.scss';
import React, { useEffect } from 'react';
import { NavLink, Outlet } from '@modern-js/runtime/router';
import {
  Box,
  Flex,
  ThemePanel,
  Tooltip,
  useThemeContext,
  updateThemeAppearanceClass,
} from '@radix-ui/themes';
import { HiOutlineMoon, HiOutlineSun } from 'react-icons/hi2';
import styles from './layout.module.scss';
import {
  StoreContextProvider,
  useStoreSnapshot,
} from '@/entries/client/stores';
import { Theme } from '@/components/Theme';
import { InternalTab } from '@/entries/client/types';
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

  useEffect(() => {
    document.documentElement.classList.add('theme-register');
  }, []);

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

const AppearanceButton = () => {
  const { appearance } = useThemeContext();

  const handleClick = () => {
    updateThemeAppearanceClass(appearance === 'light' ? 'dark' : 'light');
  };

  return (
    <Tooltip content="Appearance" side="right">
      <Box className={styles.tabButton} onClick={handleClick}>
        <Flex
          justify="center"
          align="center"
          p="1"
          className={styles.tabButtonInner}
        >
          <Box height="5" width="5" asChild>
            {appearance === 'dark' ? <HiOutlineMoon /> : <HiOutlineSun />}
          </Box>
        </Flex>
      </Box>
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
      <Box grow="1" />
      <AppearanceButton />
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
        <ThemePanel
          defaultOpen={false}
          style={{
            display:
              process.env.NODE_ENV === 'development' ? undefined : 'none',
          }}
        />
        <Navigator />
        <Breadcrumbs className={styles.breadcrumbs} />
      </Theme>
    </StoreContextProvider>
  );
}
