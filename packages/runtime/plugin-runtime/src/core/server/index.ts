import type { RuntimePluginFuture } from '../plugin';

// react component
export { PreRender, NoSSR, NoSSRCache } from './react';

export const ssr = (_config: any): RuntimePluginFuture => ({
  name: '@modern-js/plugin-ssr',
  setup: _api => {},
});

export default ssr;
