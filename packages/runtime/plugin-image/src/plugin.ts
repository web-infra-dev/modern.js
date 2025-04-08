import type { RsbuildPlugin } from '@rsbuild/core';
import type { ImageSerializableContext } from './types/image';

export const pluginImage = (
  options?: ImageSerializableContext,
): RsbuildPlugin => {
  return {
    name: '@modern-js/rsbuild-plugin-image',
    setup(api) {
      // Serialize and inject the options to the runtime context.
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(config, {
          source: {
            define: {
              __INTERNAL_MODERNJS_IMAGE_OPTIONS__: JSON.stringify(options),
            },
          },
          resolve: {
            alias: aliases => {
              if (options?.loader) {
                aliases.__INTERNAL_MODERNJS_IMAGE_LOADER__ = options.loader;
              }
              return aliases;
            },
          },
        });
      });

      // Modify the bundler chain to add the image loader.
      api.modifyBundlerChain(chain => {
        chain.module
          .rule('image-component-module')
          .type('javascript/auto')
          .resourceQuery(/\?image$/)
          .use('image-component-loader')
          .loader(require.resolve('./loader.js'));
      });
    },
  };
};

export default pluginImage;
