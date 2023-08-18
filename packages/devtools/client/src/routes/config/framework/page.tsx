import React from 'react';
import { useSnapshot } from 'valtio';
import JsonViewer from 'react-json-view';
import { useStore } from '@/stores';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  return (
    <JsonViewer src={store.framework.config} sortKeys={true} collapsed={1} />
  );
};

export default Page;
