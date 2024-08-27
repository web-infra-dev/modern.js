import { ObjectInspector } from '@/components/ObjectInspector';
import { useGlobals } from '@/entries/client/globals';
import type React from 'react';
import { useSnapshot } from 'valtio';

const Page: React.FC = () => {
  const serverExported = useGlobals();
  const { context } = useSnapshot(serverExported.framework);
  return <ObjectInspector data={context} sortObjectKeys={true} />;
};

export default Page;
