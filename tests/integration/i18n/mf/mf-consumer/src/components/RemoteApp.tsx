import { createRemoteAppComponent } from '@module-federation/modern-js/react';
import { loadRemote } from '@module-federation/modern-js/runtime';
import React from 'react';

const FallbackErrorComp = (info: any) => {
  return (
    <div
      style={{ padding: '20px', border: '1px solid red', borderRadius: '4px' }}
    >
      <h3>加载失败</h3>
      <p>{info?.error?.message}</p>
      <button onClick={() => info.resetErrorBoundary()}>重试</button>
    </div>
  );
};

const FallbackComp = (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <div>正在加载远程应用...</div>
  </div>
);

const RemoteApp = createRemoteAppComponent({
  loader: () => loadRemote('AppRemote/export-app'),
  export: 'provider' as any,
  fallback: FallbackErrorComp,
  loading: FallbackComp,
});

export default RemoteApp;
