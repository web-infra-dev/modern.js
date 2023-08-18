import React from 'react';
import { useSnapshot } from 'valtio';
import JsonViewer from 'react-json-view';
import { useStore } from '@/stores';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { entrypoints, serverRoutes } = store.framework.context;
  const { fileSystemRoutes } = store.framework;
  return (
    <div>
      <JsonViewer src={entrypoints} sortKeys={true} />
      <JsonViewer src={serverRoutes} sortKeys={true} />
      <JsonViewer src={fileSystemRoutes} sortKeys={true} />
    </div>
  );
};

export default Page;
