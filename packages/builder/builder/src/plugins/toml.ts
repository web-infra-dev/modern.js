import type { DefaultBuilderPlugin } from '@modern-js/builder-shared';
import path from 'path';

export const builderPluginToml = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-toml',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID }) => {
      chain.module
        .rule(CHAIN_ID.RULE.TOML)
        .type('javascript/auto')
        .test(/\.toml$/)
        .use(CHAIN_ID.USE.TOML)
        .loader(path.resolve(__dirname, '../../compiled/toml-loader'));
    });
  },
});
