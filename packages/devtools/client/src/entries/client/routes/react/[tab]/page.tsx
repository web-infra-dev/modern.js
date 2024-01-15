import { useParams } from '@modern-js/runtime/router';
import { Box, useThemeContext } from '@radix-ui/themes';
import React, { useMemo } from 'react';
import {
  createBridge,
  createStore,
  initialize,
} from 'react-devtools-inline/frontend';
import { $mountPoint } from '../../state';
import { useThrowable } from '@/utils';
import { WallAgent } from '@/utils/react-devtools';

const Page: React.FC = () => {
  const params = useParams();
  const ctx = useThemeContext();
  const browserTheme = ctx.appearance === 'light' ? 'light' : 'dark';

  const mountPoint = useThrowable($mountPoint);
  const InnerView = useMemo(() => {
    const wallAgent = new WallAgent();
    wallAgent.bindRemote(mountPoint.remote, 'sendReactDevtoolsData');
    const bridge = createBridge(window.parent, wallAgent);
    const store = createStore(bridge);
    const ret = initialize(window.parent, { bridge, store });
    mountPoint.remote.activateReactDevtools();
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
