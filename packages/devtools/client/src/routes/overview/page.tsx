import React from 'react';
import { Heading } from '@radix-ui/themes';
import { useSnapshot } from 'valtio';
import { useStore } from '@/stores';
import { ObjectInspector } from '@/components/ObjectInspector';

const Page: React.FC = () => {
  const $store = useStore();
  const store = useSnapshot($store);
  const { bundlerType } = store.builder.context;

  const display = {
    bundlerType,
    serverRoute: store.framework.context.serverRoutes.length,
    toolsType: store.framework.context.toolsType,
    frameworkPlugin: store.framework.config.transformed.plugins.length,
    builderPlugin: store.framework.context.plugins.length,
  };
  return (
    <div>
      <Heading as="h3">Modern.js DevTools</Heading>
      <ObjectInspector data={display} sortObjectKeys={true} />
    </div>
  );
};

export default Page;
