import { Suspense } from 'react';
import styled from '@emotion/styled';
import { useSnapshot } from 'valtio';
import { Outlet, useNavigate, useLocation } from '@modern-js/runtime/router';
import { Box, Text, Button } from '@radix-ui/themes';
import _ from 'lodash';
import { GearIcon, HomeIcon } from '@radix-ui/react-icons';
import { useStore } from '@/stores';
import { InternalTab } from '@/types';
import Breadcrumbs from '@/components/Breadcrumbs';

export const RootTabs: React.FC = () => {
  const $store = useStore();
  const tabs = useSnapshot($store.tabs);

  const navigate = useNavigate();
  const location = useLocation();
  const currentTabName = location.pathname.split('/').filter(Boolean)[0];
  const currentTab = _.find(tabs, { name: currentTabName });

  const handleClick = (tab: InternalTab) => {
    if (tab.view.type === 'builtin') {
      navigate(tab.view.url);
    } else {
      throw new Error('Unimplemented.');
    }
  };

  return (
    <TabRoot>
      <TabNavigator>
        <TabList style={{ touchAction: 'none' }}>
          <TabBrand>
            <IconBox>🌰</IconBox>
            DevTools
          </TabBrand>
        </TabList>
        <TabList>
          {tabs.map(tab => (
            <TabTrigger
              key={tab.name}
              value={tab.name}
              onClick={() => handleClick(tab as any)}
            >
              <IconBox>{tab.icon as any}</IconBox>
              {tab.title}
            </TabTrigger>
          ))}
        </TabList>
        <Box grow="1" />
        <SettingButton>
          <GearIcon />
          <Text>Settings</Text>
        </SettingButton>
      </TabNavigator>
      <TabContent>
        <Box grow="0">
          <Breadcrumbs>
            <Breadcrumbs.Button onClick={() => navigate('overview')}>
              <HomeIcon />
            </Breadcrumbs.Button>
            <Breadcrumbs.Button>{currentTab?.title}</Breadcrumbs.Button>
          </Breadcrumbs>
        </Box>
        <Box grow="1" style={{ overflow: 'hidden' }}>
          <Suspense fallback={<div>loading...</div>}>
            <Outlet />
          </Suspense>
        </Box>
      </TabContent>
    </TabRoot>
  );
};

const SettingButton = styled(Button)({
  '--accent-9': 'var(--gray-5)',
  '--accent-10': 'var(--gray-6)',
});

const IconBox = styled(Box)({
  width: '2rem',
  height: '2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const TabNavigator = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--block-gap)',
});

const TabRoot = styled(Box)({
  '--block-gap': '0.5rem',
  '--block-color': '#121212',
  display: 'flex',
  padding: 'var(--block-gap)',
  gap: 'var(--block-gap)',
  alignItems: 'stretch',
  height: '100%',
  width: '100%',
});

const TabList = styled(Box)({
  flex: 'none',
  width: '10rem',
  height: 'min-content',
  backgroundColor: 'var(--block-color)',
  borderRadius: 'var(--radius-4)',
});

const TabTrigger = styled.button({
  border: 'none',
  backgroundColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  height: '3rem',
  width: '100%',
  color: 'var(--gray-11)',
  fontSize: 'var(--font-size-2)',
  transition: 'color 200ms',
  fontWeight: 'bold',
  cursor: 'pointer',
  ':focus': {
    color: 'white',
  },
});

const TabBrand = styled(TabTrigger)({
  color: 'var(--gray-10)',
  cursor: 'default',
  ':focus': {
    color: 'var(--gray-10)',
  },
});

const TabContent = styled(Box)({
  flex: 1,
  flexDirection: 'column',
  alignItems: 'stretch',
  display: 'flex',
  gap: 'var(--space-3)',
  overflow: 'hidden',
  backgroundColor: 'var(--block-color)',
  borderRadius: 'var(--radius-4)',
  padding: '1rem',
});
