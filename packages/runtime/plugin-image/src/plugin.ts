import type { RsbuildPlugin } from '@rsbuild/core';
import type { ImageSerializableContext } from './types/image';

export const pluginImage = (
  options?: ImageSerializableContext,
): RsbuildPlugin => {
  return {
    name: '@modern-js/rsbuild-plugin-image',
    setup(api) {
      // Serialize and inject the options to the runtime context.
      api.modifyRsbuildConfig(config => {
        config.source ||= {};
        config.source.define ||= {};
        config.source.define.__INTERNAL_MODERNJS_IMAGE_OPTIONS__ =
          JSON.stringify(options);
      });

      // Modify the bundler chain to add the image loader.
      api.modifyBundlerChain((chain, { CHAIN_ID }) => {
        const rule = chain.module.rule(CHAIN_ID.RULE.IMAGE);
        rule
          .oneOf('image-component-module')
          .type('asset/resource')
          .resourceQuery(/\?image$/)
          .use('image-component-loader')
          .loader(require.resolve('./loader.cjs'));
      });
    },
  };
};

export default pluginImage;
