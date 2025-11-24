import { useParams } from '@modern-js/runtime/router';
import React from 'react';
import RemoteApp2 from '../../../components/RemoteApp2';

export default (props: Record<string, any>) => {
  const { lang } = useParams();
  return (
    <div>
      <h2>远程应用页面</h2>
      <RemoteApp2
        {...props}
        basename={`${lang}/remote-2`}
        customProp="hello from host"
      />
    </div>
  );
};
