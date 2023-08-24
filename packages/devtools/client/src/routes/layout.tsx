import '@radix-ui/themes/styles.css';
import './layout.css';
import { Suspense } from 'react';
import styled from '@emotion/styled';
import { useSnapshot } from 'valtio';
import { Outlet, useNavigate } from '@modern-js/runtime/router';
import { Box, Theme } from '@radix-ui/themes';
import { StoreContextProvider, useStore } from '@/stores';
import { InternalTab } from '@/types';

export default function Layout() {
  return (
    <StoreContextProvider>
      <Theme appearance="dark" className="dark">
        <AppContainer>
          <RootTabs />
        </AppContainer>
      </Theme>
    </StoreContextProvider>
  );
}

const RootTabs: React.FC = () => {
  const $store = useStore();
  const tabs = useSnapshot($store.tabs);

  const navigate = useNavigate();

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
      </TabNavigator>
      <TabContent>
        <Suspense fallback={<div>loading...</div>}>
          <Outlet />
        </Suspense>
      </TabContent>
    </TabRoot>
  );
};

const IconBox = styled(Box)({
  width: '2rem',
  height: '2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const AppContainer = styled(Box)({
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: '#090909',
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
  backgroundColor: 'var(--block-color)',
  borderRadius: 'var(--radius-4)',
  padding: '1rem',
});
