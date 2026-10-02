import { createRemoteAppComponent } from '@module-federation/modern-js-v3/react';
import { loadRemote } from '@module-federation/modern-js-v3/runtime';

// 定义 FallbackErrorComp 组件
const ErrorBoundary = (info?: { error: { message: string } }) => {
  return (
    <div>
      <h2>This is ErrorBoundary Component, Something went wrong:</h2>
      <pre style={{ color: 'red' }}>{info?.error.message}</pre>
    </div>
  );
};
// 定义 FallbackLoading 组件
const Loading = <div>loading...</div>;

// 使用 createRemoteComponent 导入远程应用，并配置 loader、fallback、loading 等，参数含义参考 官网文档
const RemoteApp = createRemoteAppComponent({
  loader: () => loadRemote('remote/app'),
  fallback: ErrorBoundary,
  loading: Loading,
});

export default RemoteApp;
