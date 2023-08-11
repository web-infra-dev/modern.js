import React from 'react';
import { useSnapshot } from 'valtio';
// @ts-expect-error
import { routes } from '@_modern_js_internal/main/routes';
import { useStore } from '@/stores';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { serverRoutes } = store.router;
  return (
    <div>
      <pre>{JSON.stringify(serverRoutes, null, 2)}</pre>
      <pre>{JSON.stringify(routes, null, 2)}</pre>
    </div>
  );
};

export default Page;
