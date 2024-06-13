import React, { useEffect } from 'react';
import { useNavigate } from '@modern-js/runtime/router';
import { use } from '@/utils';
import { $mountPoint } from '@/entries/client/routes/state';

let _intendPullUp = '';

$mountPoint.then(({ hooks }) => {
  hooks.hookOnce('pullUp', async target => {
    _intendPullUp = target;
  });
});

export const Puller: React.FC = () => {
  const navigate = useNavigate();
  const mountPoint = use($mountPoint);
  useEffect(() => {
    _intendPullUp && navigate(_intendPullUp);
    mountPoint.hooks.hook('pullUp', async target => {
      navigate(target);
    });
  }, []);
  return null;
};
