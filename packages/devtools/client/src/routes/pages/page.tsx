import React from 'react';
import { useSnapshot } from 'valtio';
import { useStore } from '@/stores';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { entrypoints, serverRoutes } = store.framework.context;
  const { fileSystemRoutes } = store.framework;
  return (
    <div>
      <pre>{JSON.stringify(entrypoints, null, 2)}</pre>
      <pre>{JSON.stringify(serverRoutes, null, 2)}</pre>
      <pre>{JSON.stringify(fileSystemRoutes, null, 2)}</pre>
    </div>
  );
};

export default Page;
