import React from 'react';
import { useSnapshot } from 'valtio';
import { useStore } from '@/stores';
import { ObjectInspector } from '@/components/ObjectInspector';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { entrypoints, serverRoutes } = store.framework.context;
  const { fileSystemRoutes } = store.framework;

  const routes = serverRoutes.map(route => ({
    ...route,
    entry: entrypoints.find(entry => entry.entryName === route.entryName),
    fileSystemRoutes: route.entryName && fileSystemRoutes[route.entryName],
  }));

  return (
    <div>
      <ObjectInspector data={routes} sortObjectKeys={true} />
    </div>
  );
};

export default Page;
