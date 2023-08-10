import React from 'react';
import { useSnapshot } from 'valtio';
import { useStore } from '@/stores';

export const Foo: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { serverRoutes } = store.router;
  const { frameworkConfig } = store.config;
  return (
    <div>
      <pre>{JSON.stringify(serverRoutes, null, 2)}</pre>
      <pre>{JSON.stringify(frameworkConfig, null, 2)}</pre>
    </div>
  );
};
