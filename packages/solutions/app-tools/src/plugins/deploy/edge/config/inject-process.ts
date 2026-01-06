import type { RsbuildPlugin } from '@rsbuild/core';

export const injectProcessPlugin: RsbuildPlugin = {
  name: 'edge-plugin-inject-process',
  setup(api) {
    api.modifyRspackConfig((config, { rspack }) => {
      config.plugins.push(
        new rspack.ProvidePlugin({
          process: ['node:process'],
        }),
      );
    });
  },
};
