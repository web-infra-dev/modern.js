import path from 'path';
import type { BuilderPlugin } from '../types';

export const PluginPug = (): BuilderPlugin => ({
  name: 'builder-plugin-pug',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getBuilderConfig();
      if (!config.tools?.pug) {
        return;
      }

      const { applyOptionsChain } = await import('@modern-js/utils');

      chain.module
        .rule(CHAIN_ID.RULE.PUG)
        .test(/\.pug$/)
        .use(CHAIN_ID.USE.PUG)
        .loader(path.resolve('../webpackLoaders/pugLoader'))
        .options(applyOptionsChain({}, config.tools?.pug));
    });
  },
});
