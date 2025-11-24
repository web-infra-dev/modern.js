import { createRemoteAppComponent } from '@module-federation/bridge-react';
import { loadRemote } from '@module-federation/modern-js/runtime';
import React from 'react';

// 错误回退组件
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

// 加载中组件
const FallbackComp = (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <div>正在加载远程应用...</div>
  </div>
);

// 创建远程应用组件
const RemoteApp = createRemoteAppComponent({
  // loader: () => import('AppRemote/export-App'),
  // 或者使用 loadRemote:
  loader: () => loadRemote('AppRemote/export-app-custom'),
  export: 'provider' as any, // 指定导出的 provider
  fallback: FallbackErrorComp,
  loading: FallbackComp,
});

export default RemoteApp;
