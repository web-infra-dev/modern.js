import React from 'react';
import { useSnapshot } from 'valtio';
import { useParams } from '@modern-js/runtime/router';
import { useStore } from '@/client/stores';
import { ObjectInspector } from '@/client/components/ObjectInspector';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { toolkit, type } = useParams() as {
    toolkit: 'framework' | 'builder' | 'bundler';
    type: 'resolved' | 'transformed';
  };

  return (
    <ObjectInspector data={store[toolkit].config[type]} sortObjectKeys={true} />
  );
};

export default Page;
