import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin, SourceConfig } from '../types';

export const PluginDefine = (): BuilderPlugin => ({
  name: 'builder-plugin-define',

  async setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();

      const builtinVars: NonNullable<SourceConfig['globalVars']> = {
        'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
      };

      // Serialize global vars. User can customize value of `builtinVars`.
      const globalVars = { ...builtinVars, ...config.source.globalVars };
      const serializedVars = _.mapValues(globalVars, value =>
        JSON.stringify(value),
      );
      // Macro defines.
      const defineExprs = config.source.define;

      const { DefinePlugin } = await import('webpack');
      chain
        .plugin(CHAIN_ID.PLUGIN.DEFINE)
        .use(DefinePlugin, [{ ...serializedVars, ...defineExprs }]);
    });
  },
});
