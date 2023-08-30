import React from 'react';
import { useSnapshot } from 'valtio';
import { useStore } from '@/stores';
import { ObjectInspector } from '@/components/ObjectInspector';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  return <ObjectInspector data={store.builder.context} sortObjectKeys={true} />;
};

export default Page;
