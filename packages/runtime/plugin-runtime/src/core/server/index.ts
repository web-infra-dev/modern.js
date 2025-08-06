import type { RuntimePlugin } from '../plugin';

// react component
export { NoSSR, NoSSRCache } from './react';

export const ssr = (_config: any): RuntimePlugin => ({
  name: '@modern-js/plugin-ssr',
  setup: _api => {},
});

export default ssr;
