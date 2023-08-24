import React from 'react';
import { Heading } from '@radix-ui/themes';
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
      <Heading as="h3">Modern.js DevTools</Heading>
      <JsonViewer src={display} sortKeys={true} />
    </div>
  );
};

export default Page;
