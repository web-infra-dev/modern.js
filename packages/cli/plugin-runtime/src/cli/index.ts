import { createPlugin, usePlugins } from '@modern-js/core';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';

// eslint-disable-next-line react-hooks/rules-of-hooks
usePlugins([
  require.resolve('@modern-js/plugin-state/cli'),
  require.resolve('@modern-js/plugin-router/cli'),
  require.resolve('@modern-js/plugin-ssr/cli'),
]);

export default createPlugin(
  () => ({
    config() {
      return {
        runtime: {},
        runtimeByEntries: {},
      };
    },
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/runtime'];
    },
  }),
  {
    name: '@modern-js/runtime',
    post: [
      '@modern-js/plugin-router',
      '@modern-js/plugin-ssr',
      '@modern-js/plugin-state',
    ],
  },
) as any;
