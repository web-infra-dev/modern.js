import React from 'react';
import { useSnapshot } from 'valtio';
import { useStore } from '@/stores';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  return <pre>{JSON.stringify(store.builder.config, null, 2)}</pre>;
};

export default Page;
