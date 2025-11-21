import React from 'react';
import RemoteApp from '../../components/RemoteApp';

export default (props: Record<string, any>) => {
  return (
    <div>
      <h2>远程应用页面</h2>
      <RemoteApp {...props} basename="remote" customProp="hello from host" />
    </div>
  );
};
