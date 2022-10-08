import type { BuilderPlugin } from '../types';

export const PluginToml = (): BuilderPlugin => ({
  name: 'builder-plugin-toml',

  setup(api) {
    api.modifyWebpackChain((chain, { CHAIN_ID, getCompiledPath }) => {
      chain.module
        .rule(CHAIN_ID.RULE.TOML)
        .test(/\.toml$/)
        .use(CHAIN_ID.USE.TOML)
        .loader(getCompiledPath('toml-loader'));
    });
  },
});
