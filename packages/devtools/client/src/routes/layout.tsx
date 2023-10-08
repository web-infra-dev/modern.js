import '@radix-ui/themes/styles.css';
import './layout.css';
import styled from '@emotion/styled';
import { Box, ThemePanel } from '@radix-ui/themes';
import { RootTabs } from './RootTabs';
import { StoreContextProvider } from '@/stores';
import { Theme } from '@/components/Theme';

export default function Layout() {
  return (
    <StoreContextProvider>
      <Theme panelBackground="solid">
        {process.env.NODE_ENV === 'development' && (
          <ThemePanel defaultOpen={false} />
        )}
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
