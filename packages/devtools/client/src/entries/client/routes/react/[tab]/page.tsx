import { useLocation, useNavigate, useParams } from '@modern-js/runtime/router';
import { Box, useThemeContext } from '@radix-ui/themes';
import React, { useEffect, useMemo } from 'react';
import {
  initialize,
  createBridge,
  createStore,
} from 'react-devtools-inline/frontend';
import { $mountPoint } from '../../state';
import { wallAgent } from '../state';
import { useThrowable } from '@/utils';

const Page: React.FC = () => {
  const params = useParams();
  const ctx = useThemeContext();
  const location = useLocation();
  const navigate = useNavigate();
  const browserTheme = ctx.appearance === 'light' ? 'light' : 'dark';

  const mountPoint = useThrowable($mountPoint);
  useEffect(() => {
    mountPoint.remote.activateReactDevtools();
  }, []);

  useEffect(() => {
    // 检查URL的hash部分
    if (location.hash === '#inspecting') {
      const startInspecting = () => {
        wallAgent.send('startInspectingNative', null);
        navigate(location.pathname, { replace: true });
      };
      if (wallAgent.status === 'active') {
        startInspecting();
      } else {
        wallAgent.hookOnce('active', startInspecting);
      }
    }
  }, [location, navigate]);

  const InnerView = useMemo(() => {
    const bridge = createBridge(window.parent, wallAgent);
    const store = createStore(bridge);
    const ret = initialize(window.parent, { bridge, store });
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
