import { Box, useThemeContext } from '@radix-ui/themes';
import React from 'react';
import {
  createBridge,
  createStore,
  initialize,
} from 'react-devtools-inline/frontend';
import { useAsync } from 'react-use';
import { parseQuery } from 'ufo';
import { useLocation, useParams } from '@modern-js/runtime/router';
import { setupMountPointConnection } from '@/entries/client/rpc';
import { once } from '@/utils/once';

const connTask = setupMountPointConnection();

const Page: React.FC = () => {
  const params = useParams();
  const ctx = useThemeContext();
  const loc = useLocation();
  const browserTheme = ctx.appearance === 'light' ? 'light' : 'dark';

  const { value: InnerView } = useAsync(async () => {
    const { mountPoint, wall } = await connTask;
    const bridge = createBridge(window.parent, wall);
    const store = createStore(bridge);
    const ret = initialize(window.parent, { bridge, store });
    mountPoint.activateReactDevtools();
    if ('inspect' in parseQuery(loc.search)) {
      await once(bridge, 'operations');
      bridge.send('startInspectingNative');
    }
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
        <InnerView
          browserTheme={browserTheme}
          overrideTab={params.tab === 'profiler' ? 'profiler' : 'components'}
          hideSettings={false}
        />
      )}
    </Box>
  );
};

export default Page;
