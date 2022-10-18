import path from 'path';
import type { BuilderPlugin } from '../types';

export const PluginPug = (): BuilderPlugin => ({
  name: 'builder-plugin-pug',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const { pug } = config.tools;
      if (!pug) {
        return;
      }

      const { applyOptionsChain } = await import('@modern-js/utils');

      chain.module
        .rule(CHAIN_ID.RULE.PUG)
        .test(/\.pug$/)
        .use(CHAIN_ID.USE.PUG)
        .loader(path.resolve('../webpackLoaders/pugLoader'))
        .options(applyOptionsChain({}, pug === true ? {} : pug));
    });
  },
});
