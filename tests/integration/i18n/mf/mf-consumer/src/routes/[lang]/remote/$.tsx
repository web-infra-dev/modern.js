import { useParams } from '@modern-js/runtime/router';
import React from 'react';
import RemoteApp from '../../../components/RemoteApp';

export default (props: Record<string, any>) => {
  const { lang } = useParams();
  return (
    <div>
      <h2>远程应用页面</h2>
      <RemoteApp
        {...props}
        basename={`${lang}/remote`}
        customProp="hello from host"
      />
    </div>
  );
};
