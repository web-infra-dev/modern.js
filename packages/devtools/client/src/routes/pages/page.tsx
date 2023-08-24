import React from 'react';
import { useSnapshot } from 'valtio';
import { useStore } from '@/stores';
import { ObjectInspector } from '@/components/ObjectInspector';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { entrypoints, serverRoutes } = store.framework.context;
  const { fileSystemRoutes } = store.framework;
  return (
    <div>
      <ObjectInspector data={entrypoints} sortObjectKeys={true} />
      <ObjectInspector data={serverRoutes} sortObjectKeys={true} />
      <ObjectInspector data={fileSystemRoutes} sortObjectKeys={true} />
    </div>
  );
};

export default Page;
