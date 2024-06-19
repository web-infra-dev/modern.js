import React from 'react';
import { useParams } from '@modern-js/runtime/router';
import { useSnapshot } from 'valtio';
import { useGlobals } from '@/entries/client/globals';
import { ObjectInspector } from '@/components/ObjectInspector';

const Page: React.FC = () => {
  const globals = useGlobals();
  const configSet = {
    framework: useSnapshot(globals.framework.config),
    builder: useSnapshot(globals.builder.config),
    bundler: useSnapshot(globals.bundler.configs),
  } as const;
  const { toolkit, type } = useParams() as {
    toolkit: 'framework' | 'builder' | 'bundler';
    type: 'resolved' | 'transformed';
  };
  const config = configSet[toolkit][type];

  return <ObjectInspector data={config} sortObjectKeys={true} />;
};

export default Page;
