import { Box, useThemeContext } from '@radix-ui/themes';
import React from 'react';
import {
  createBridge,
  createStore,
  initialize,
} from 'react-devtools-inline/frontend';
import { useAsync } from 'react-use';
import { setupMountPointConnection } from '../../rpc';

const connTask = setupMountPointConnection();

const Page: React.FC = () => {
  const ctx = useThemeContext();
  const browserTheme = ctx.appearance === 'light' ? 'light' : 'dark';

  const { value: InnerView } = useAsync(async () => {
    const { mountPoint, wall } = await connTask;
    const bridge = createBridge(window.parent, wall);
    const store = createStore(bridge);
    const ret = initialize(window.parent, { bridge, store });
    mountPoint.activateReactDevtools();
    return ret;
  }, []);

  return (
    <Box
      style={{
        position: 'fixed',
        left: 'var(--navigator-width)',
        top: 'var(--breadcrumb-height)',
        bottom: 0,
        right: 0,
      }}
    >
      {InnerView && (
        <InnerView browserTheme={browserTheme} hideSettings={false} />
      )}
    </Box>
  );
};

export default Page;
