import type { BuilderPlugin } from '../types';

/**
 * Provide some temporary configurations for Rspack early transition
 */
export const builderPluginTransition = (): BuilderPlugin => ({
  name: 'builder-plugin-transition',

  setup(api) {
    api.modifyBuilderConfig(async (config, { mergeBuilderConfig }) => {
      const { fs } = await import('@modern-js/utils');

      // Align with webpack. Some configurations are not currently supported in Rspack, but will be in the future.
      process.env.RSPACK_CONFIG_VALIDATE = 'loose-silent';

      return mergeBuilderConfig(config, {
        tools: {
          rspack: {
            experiments: {
              // will be built-in in rspack 0.2.0
              newSplitChunks: true,
            },
          },
          devServer: {
            devMiddleware: {
              // not support set writeToDisk true or function, so use outputFileSystem instead.
              outputFileSystem: fs,
            },
          },
        },
      });
    });
  },
});
