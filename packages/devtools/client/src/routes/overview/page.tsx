import React from 'react';
import { useSnapshot } from 'valtio';
import JsonViewer from 'react-json-view';
import { useStore } from '@/stores';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { bundlerType } = store.builder.context;
  const display = {
    bundlerType,
  };
  return (
    <div>
      <h3>Modern.js DevTools</h3>
      <JsonViewer src={display} sortKeys={true} />
    </div>
  );
};

export default Page;
