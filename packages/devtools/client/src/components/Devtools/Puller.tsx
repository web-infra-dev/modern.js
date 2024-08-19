import type React from 'react';
import { useEffect } from 'react';
import { useNavigate } from '@modern-js/runtime/router';
import { $$globals, useGlobals } from '@/entries/client/globals';

let _intendPullUp = '';

$$globals.then(({ mountPoint }) => {
  mountPoint.hooks.hookOnce('pullUp', async target => {
    _intendPullUp = target;
  });
});

export const Puller: React.FC = () => {
  const navigate = useNavigate();
  const { mountPoint } = useGlobals();
  useEffect(() => {
    _intendPullUp && navigate(_intendPullUp);
    mountPoint.hooks.hook('pullUp', async target => {
      navigate(target);
    });
  }, []);
  return null;
};
