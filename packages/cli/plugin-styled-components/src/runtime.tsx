import type { RuntimePlugin } from '@modern-js/runtime';

export default (): RuntimePlugin => ({
  name: '@modern-js/plugin-styled-components',
  setup: api => {
    api.onBeforeRender(context => {});
  },
});
