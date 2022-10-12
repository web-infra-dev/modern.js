import type { BuilderPlugin } from '../types';

export const PluginYaml = (): BuilderPlugin => ({
  name: 'builder-plugin-yaml',

  setup(api) {
    api.modifyWebpackChain((chain, { CHAIN_ID, getCompiledPath }) => {
      chain.module
        .rule(CHAIN_ID.RULE.YAML)
        .test(/\.ya?ml$/)
        .use(CHAIN_ID.USE.YAML)
        .loader(getCompiledPath('yaml-loader'));
    });
  },
});
