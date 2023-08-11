import React from 'react';
import { useSnapshot } from 'valtio';
import { useStore } from '@/stores';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { frameworkConfig } = store.config;
  return <pre>{JSON.stringify(frameworkConfig, null, 2)}</pre>;
};

export default Page;
