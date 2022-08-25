import type { BuilderPlugin } from '../types';

export const PluginToml = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-toml',

  setup(api) {
    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      chain.module
        .rule(CHAIN_ID.RULE.TOML)
        .test(/\.toml$/)
        .use(CHAIN_ID.USE.TOML)
        .loader(require.resolve('../../compiled/toml-loader'));
    });
  },
});
