import React from 'react';
import { useSnapshot } from 'valtio';
import { useGlobals } from '@/entries/client/globals';
import { ObjectInspector } from '@/components/ObjectInspector';

const Page: React.FC = () => {
  const serverExported = useGlobals();
  const { context } = useSnapshot(serverExported.framework);
  return <ObjectInspector data={context} sortObjectKeys={true} />;
};

export default Page;
