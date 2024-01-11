import { useParams } from '@modern-js/runtime/router';
import { Box, useThemeContext } from '@radix-ui/themes';
import React from 'react';
import {
  createBridge,
  createStore,
  initialize,
} from 'react-devtools-inline/frontend';
import { useAsync } from 'react-use';
import { createDebugger } from 'hookable';
import { $mountPoint } from '../../state';
import { useThrowable } from '@/utils';
import { WallAgent } from '@/utils/react-devtools';

const Page: React.FC = () => {
  const params = useParams();
  const ctx = useThemeContext();
  const browserTheme = ctx.appearance === 'light' ? 'light' : 'dark';

  const mountPoint = useThrowable($mountPoint);
  const { value: InnerView } = useAsync(async () => {
    const wallAgent = new WallAgent();
    createDebugger(wallAgent, { tag: 'client' });
    mountPoint.hooks.hook('sendReactDevtoolsData', async e => {
      await wallAgent.callHook('receive', e);
    });
    wallAgent.hook('send', async e => {
      await mountPoint.remote.sendReactDevtoolsData(e);
    });
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
