import React from 'react';
import { useSnapshot } from 'valtio';
import { useStore } from '@/stores';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { config } = store.framework;
  return <pre>{JSON.stringify(config, null, 2)}</pre>;
};

export default Page;
