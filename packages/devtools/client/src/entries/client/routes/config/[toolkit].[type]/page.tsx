import React from 'react';
import { useParams } from '@modern-js/runtime/router';
import { useSnapshot } from 'valtio';
import { $serverExported } from '../../state';
import { ObjectInspector } from '@/components/ObjectInspector';
import { use } from '@/utils';

const Page: React.FC = () => {
  const serverExported = use($serverExported);
  const configSet = {
    framework: useSnapshot(serverExported.framework.config),
    builder: useSnapshot(serverExported.builder.config),
    bundler: useSnapshot(serverExported.bundler.configs),
  } as const;
  const { toolkit, type } = useParams() as {
    toolkit: 'framework' | 'builder' | 'bundler';
    type: 'resolved' | 'transformed';
  };
  const config = configSet[toolkit][type];

  return <ObjectInspector data={config} sortObjectKeys={true} />;
};

export default Page;
