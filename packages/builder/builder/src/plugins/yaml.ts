import type { DefaultBuilderPlugin } from '@modern-js/builder-shared';
import path from 'path';

export const builderPluginYaml = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-yaml',

  setup(api) {
    api.modifyBundlerChain((chain, { CHAIN_ID }) => {
      chain.module
        .rule(CHAIN_ID.RULE.YAML)
        .type('javascript/auto')
        .test(/\.ya?ml$/)
        .use(CHAIN_ID.USE.YAML)
        .loader(path.resolve(__dirname, '../../compiled/yaml-loader'));
    });
  },
});
