import { useNavigate } from '@modern-js/runtime/router';
import React, { ComponentType, useEffect } from 'react';
import { useGetSet } from 'react-use';
import { Box, useThemeContext } from '@radix-ui/themes';
import {
  DevtoolsProps,
  createBridge,
  createStore,
  initialize,
} from 'react-devtools-inline/frontend';
import { setupMountPointConnection } from '../../rpc';

let connecting = false;

const Page: React.FC = () => {
  const [getView, setView] = useGetSet<ComponentType<DevtoolsProps> | null>(
    null,
  );
  const View = getView();
  const navigate = useNavigate();
  const ctx = useThemeContext();
  const browserTheme = ctx.appearance === 'light' ? 'light' : 'dark';

  useEffect(() => {
    if (window.parent.window) {
      navigate('./');
    }
  }, []);

  const handleRef = async (ref: HTMLDivElement | null) => {
    if (!ref || getView() || connecting) return;
    connecting = true;
    const { mountPoint, wall } = await setupMountPointConnection();
    const bridge = createBridge(window.parent, wall);
    const store = createStore(bridge);
    const DevTools = initialize(window.parent, { bridge, store });
    mountPoint.activateReactDevtools();
    setView(React.memo(DevTools));
  };

  return (
    <Box
      ref={handleRef}
      style={{
        position: 'fixed',
        left: 'var(--navigator-width)',
        top: 'var(--breadcrumb-height)',
        bottom: 0,
        right: 0,
      }}
    >
      {View && <View browserTheme={browserTheme} hideSettings={false} />}
    </Box>
  );
};

export default Page;
