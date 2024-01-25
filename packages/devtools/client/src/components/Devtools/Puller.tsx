import React, { useEffect } from 'react';
import { useNavigate } from '@modern-js/runtime/router';
import { useThrowable } from '@/utils';
import { $mountPoint } from '@/entries/client/routes/state';
import { bridge } from '@/entries/client/routes/react/state';

let _intendPullUp = false;

$mountPoint.then(({ hooks }) => {
  hooks.hookOnce('pullUpReactInspector', async () => {
    _intendPullUp = true;
  });
});

export const DevtoolsPuller: React.FC = () => {
  const navigate = useNavigate();
  const mountPoint = useThrowable($mountPoint);
  const handlePullUp = async () => {
    navigate('/react');
    const { store } = await import('@/entries/client/routes/react/state');
    if (store.backendVersion) {
      bridge.send('startInspectingNative');
    } else {
      const handleOperations = () => {
        bridge.removeListener('operations', handleOperations);
        bridge.send('startInspectingNative');
      };
      bridge.addListener('operations', handleOperations);
    }
  };
  useEffect(() => {
    _intendPullUp && handlePullUp();
    mountPoint.hooks.hook('pullUpReactInspector', handlePullUp);
  }, []);
  return null;
};
