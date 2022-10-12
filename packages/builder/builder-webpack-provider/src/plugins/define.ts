import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin, SourceConfig } from '../types';

export const PluginDefine = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-define',

  async setup(api) {
    const { default: webpack } = await import('webpack');
    const config = api.getBuilderConfig();

    const builtinVars: NonNullable<SourceConfig['globalVars']> = {
      NODE_ENV: process.env.NODE_ENV || 'development',
    };

    // Serialize global vars. User can customize value of `builtinVars`.
    const globalVars = _.assign(builtinVars, config.source?.globalVars);
    const serializedVars = _(globalVars)
      .mapKeys((_value, key) => `process.env.${key}`)
      .mapValues(value => JSON.stringify(value))
      .value();
    // Macro defines.
    const defineExprs = config.source?.define ?? {};

    // Apply define plugin
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      chain
        .plugin(CHAIN_ID.PLUGIN.DEFINE)
        .use(webpack.DefinePlugin, [{ ...serializedVars, ...defineExprs }]);
    });
  },
});
