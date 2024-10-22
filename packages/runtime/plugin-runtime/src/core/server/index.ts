import type { Plugin } from '../plugin';

// react component
export { PreRender, NoSSR, NoSSRCache } from './react';

export const ssr = (_config: any): Plugin => ({
  name: '@modern-js/plugin-ssr',
  setup: () => ({}),
});

export default ssr;
