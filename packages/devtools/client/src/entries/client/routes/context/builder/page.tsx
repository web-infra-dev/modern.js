import React from 'react';
import { useSnapshot } from 'valtio';
import { $serverExported } from '../../state';
import { ObjectInspector } from '@/components/ObjectInspector';
import { use } from '@/utils';

const Page: React.FC = () => {
  const serverExported = use($serverExported);
  const { context } = useSnapshot(serverExported.framework);
  return <ObjectInspector data={context} sortObjectKeys={true} />;
};

export default Page;
