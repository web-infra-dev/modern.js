import React from 'react';
import { useSnapshot } from 'valtio';
import { $framework } from '../../state';
import { ObjectInspector } from '@/components/ObjectInspector';

const Page: React.FC = () => {
  const { context } = useSnapshot($framework);
  return <ObjectInspector data={context} sortObjectKeys={true} />;
};

export default Page;
