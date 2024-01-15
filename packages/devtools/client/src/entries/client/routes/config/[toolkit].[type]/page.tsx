import React from 'react';
import { useSnapshot } from 'valtio';
import { useParams } from '@modern-js/runtime/router';
import { $builder, $bundler, $framework } from '../../state';
import { ObjectInspector } from '@/components/ObjectInspector';

const Page: React.FC = () => {
  const configSet = {
    framework: useSnapshot($framework).config,
    builder: useSnapshot($builder).config,
    bundler: useSnapshot($bundler).config,
  } as const;
  const { toolkit, type } = useParams() as {
    toolkit: 'framework' | 'builder' | 'bundler';
    type: 'resolved' | 'transformed';
  };
  const config = configSet[toolkit][type];

  return <ObjectInspector data={config} sortObjectKeys={true} />;
};

export default Page;
