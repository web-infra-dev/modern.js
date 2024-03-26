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
import { Tab } from '@modern-js/devtools-kit/runtime';
import { useSnapshot } from 'valtio';
import styles from './layout.module.scss';
import { $tabs } from './state';
import { Theme } from '@/components/Theme';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Puller } from '@/components/Devtools/Puller';

const NavigateButton: React.FC<{ tab: Tab }> = ({ tab }) => {
  let to = '';
  if (tab.view.type === 'builtin') {
    to = tab.view.src;
  } else if (tab.view.type === 'iframe') {
    to = `/iframe/${tab.view.src}`;
  } else if (tab.view.type === 'external') {
    to = `/external/${tab.name}`;
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
  const tabs = useSnapshot($tabs);

  return (
    <Flex direction="column" shrink="0" className={styles.navigator}>
      {tabs.map(tab => (
        // @ts-expect-error
        <NavigateButton key={tab.name} tab={tab} />
      ))}
      <Box grow="1" />
      <AppearanceButton />
    </Flex>
  );
};

const Layout = () => {
  const display = process.env.NODE_ENV === 'development' ? undefined : 'none';
  return (
    <Theme
      className={styles.wrapper}
      accentColor="blue"
      panelBackground="solid"
    >
      <Navigator />
      <Box width="100%" position="relative" pt="4">
        <Box width="100%" height="100%" position="relative">
          <Outlet />
        </Box>
        <Breadcrumbs
          className={styles.breadcrumbs}
          height="7"
          position="absolute"
          top="0"
          left="0"
          right="0"
        />
      </Box>
      <ThemePanel defaultOpen={false} style={{ display }} />
      <Puller />
    </Theme>
  );
};

export default Layout;
