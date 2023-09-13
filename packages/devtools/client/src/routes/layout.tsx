import '@radix-ui/themes/styles.css';
import './layout.css';
import styled from '@emotion/styled';
import { Box, Theme } from '@radix-ui/themes';
import { RootTabs } from './RootTabs';
import { StoreContextProvider } from '@/stores';

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

const AppContainer = styled(Box)({
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: '#090909',
});
