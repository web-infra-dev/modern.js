import React from 'react';
import { useSnapshot } from 'valtio';
import { $builder } from '../../state';
import { ObjectInspector } from '@/components/ObjectInspector';

const Page: React.FC = () => {
  const { context } = useSnapshot($builder);
  return <ObjectInspector data={context} sortObjectKeys={true} />;
};

export default Page;
