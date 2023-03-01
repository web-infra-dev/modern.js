import type { BuilderPlugin } from '../types';

/**
 * Provide some temporary configurations for rspack early transition
 */
export const builderPluginTransition = (): BuilderPlugin => ({
  name: 'builder-plugin-transition',

  setup(api) {
    api.modifyBuilderConfig(async (config, { mergeBuilderConfig }) => {
      const { fs } = await import('@modern-js/utils');

      return mergeBuilderConfig(config, {
        tools: {
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
