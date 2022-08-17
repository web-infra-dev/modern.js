import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin } from '../types';

const builtinVars: Record<string, string> = {
  'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
};

export const PluginDefine = (): BuilderPlugin => ({
  name: 'web-builder-plugin-define',

  async setup(api) {
    const { DefinePlugin } = await import('webpack');
    const config = api.getBuilderConfig();
    const globalVars = _.assign({}, config.source?.globalVars, builtinVars);

    // Serialize global vars
    const serializedVars = _.mapValues(globalVars, value =>
      JSON.stringify(value),
    );

    // Apply define plugin
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      chain.plugin(CHAIN_ID.PLUGIN.DEFINE).use(DefinePlugin, [serializedVars]);
    });
  },
});
