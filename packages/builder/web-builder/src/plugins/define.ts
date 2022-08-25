import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin } from '../types';

export const PluginDefine = (): BuilderPlugin => ({
  name: 'web-builder-plugin-define',

  async setup(api) {
    const { default: webpack } = await import('webpack');
    const config = api.getBuilderConfig();

    const builtinVars: Record<string, string> = {
      'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
    };

    const globalVars = _.assign({}, config.source?.globalVars, builtinVars);

    // Serialize global vars
    const serializedVars = _.mapValues(globalVars, value =>
      JSON.stringify(value),
    );

    // Apply define plugin
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      chain
        .plugin(CHAIN_ID.PLUGIN.DEFINE)
        .use(webpack.DefinePlugin, [serializedVars]);
    });
  },
});
