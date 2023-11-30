import { useNavigate } from '@modern-js/runtime/router';
import React, { ComponentType, useEffect } from 'react';
import { useGetSet } from 'react-use';
import { Box, useThemeContext } from '@radix-ui/themes';
import { DevtoolsProps, initialize } from 'react-devtools-inline/frontend';

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

  const handleRef = (ref: HTMLDivElement | null) => {
    if (!ref || getView()) return;
    const DevTools = initialize(window.parent);
    // TODO: will implement custom bridge via birpc.
    // @ts-expect-error: builtin bridge can only inspect react application in iframe.
    window.parent.parent = window;
    window.parent.postMessage({
      type: 'modern_js_devtools::react_devtools::activate',
    });
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
