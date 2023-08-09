import React from 'react';
import { useSnapshot } from 'valtio';
import { $router } from '@/stores/router';

export const Foo: React.FC = () => {
  const router = useSnapshot($router);
  return <pre>{JSON.stringify(router.routes, null, 2)}</pre>;
};
