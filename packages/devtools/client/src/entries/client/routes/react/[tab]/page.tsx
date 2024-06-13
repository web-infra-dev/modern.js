import { useLocation, useNavigate, useParams } from '@modern-js/runtime/router';
import { Box, useThemeContext } from '@radix-ui/themes';
import React, { useEffect, useMemo } from 'react';
import {
  initialize,
  createBridge,
  createStore,
} from 'react-devtools-inline/frontend';
import { wallAgent } from '../state';
import { useGlobals } from '@/entries/client/globals';

const Page: React.FC = () => {
  const params = useParams();
  const ctx = useThemeContext();
  const location = useLocation();
  const navigate = useNavigate();
  const browserTheme = ctx.appearance === 'light' ? 'light' : 'dark';

  const { mountPoint } = useGlobals();

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
    <Box width="100%" height="100%" pt="5">
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
