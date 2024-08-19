import { useLocation, useNavigate, useParams } from '@modern-js/runtime/router';
import { Box, useThemeContext } from '@radix-ui/themes';
import type React from 'react';
import { useEffect } from 'react';
import { useSnapshot } from 'valtio';
import { useGlobals } from '@/entries/client/globals';

const Page: React.FC = () => {
  const params = useParams();
  const ctx = useThemeContext();
  const location = useLocation();
  const navigate = useNavigate();
  const browserTheme = ctx.appearance === 'light' ? 'light' : 'dark';

  const { mountPoint, react } = useSnapshot(useGlobals());

  useEffect(() => {
    mountPoint.remote.activateReactDevtools();
  }, []);

  useEffect(() => {
    // 检查URL的hash部分
    if (location.hash === '#inspecting') {
      const startInspecting = () => {
        react.devtools.wallAgent.send('startInspectingNative', null);
        navigate(location.pathname, { replace: true });
      };
      if (react.devtools.wallAgent.status === 'active') {
        startInspecting();
      } else {
        react.devtools.wallAgent.hookOnce('active', startInspecting);
      }
    }
  }, [location, navigate]);

  return (
    <Box width="100%" height="100%" pt="5">
      <react.devtools.Renderer
        browserTheme={browserTheme}
        overrideTab={params.tab === 'profiler' ? 'profiler' : 'components'}
        hideSettings={false}
      />
    </Box>
  );
};

export default Page;
