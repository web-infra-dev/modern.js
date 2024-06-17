import ReactDOM from 'react-dom/client';
import { createApp, bootstrap } from '@modern-js/runtime';
import { contextPlugin } from './plugins/context';
import App from './App';

const WrappedApp = createApp({
  // 传入自定义插件
  plugins: [contextPlugin()],
})(App);

bootstrap(WrappedApp, 'root', undefined, ReactDOM);
