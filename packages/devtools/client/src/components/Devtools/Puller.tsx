import React, { useEffect } from 'react';
import { useNavigate } from '@modern-js/runtime/router';
import { useThrowable } from '@/utils';
import { $mountPoint } from '@/entries/client/routes/state';
import { wallAgent } from '@/entries/client/routes/react/state';

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
    if (wallAgent.status === 'active') {
      wallAgent.send('startInspectingNative', null);
    } else {
      wallAgent.hookOnce('active', () => {
        wallAgent.send('startInspectingNative', null);
      });
    }
  };
  useEffect(() => {
    _intendPullUp && handlePullUp();
    mountPoint.hooks.hook('pullUpReactInspector', handlePullUp);
  }, []);
  return null;
};
