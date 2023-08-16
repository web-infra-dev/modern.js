import React from 'react';
import { useSnapshot } from 'valtio';
import { useStore } from '@/stores';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { serverRoutes } = store.router;
  return (
    <div>
      <pre>{JSON.stringify(serverRoutes, null, 2)}</pre>
    </div>
  );
};

export default Page;
