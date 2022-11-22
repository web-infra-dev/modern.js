import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin, SourceConfig } from '../types';
import { setConfig } from '@modern-js/builder-shared';

export const PluginDefine = (): BuilderPlugin => ({
  name: 'builder-plugin-define',

  async setup(api) {
    api.modifyRspackConfig(async rspackConfig => {
      const config = api.getNormalizedConfig();

      const builtinVars: NonNullable<SourceConfig['globalVars']> = {
        'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
      };

      // Serialize global vars. User can customize value of `builtinVars`.
      const globalVars = {
        ...builtinVars,
        ...(config.source.globalVars ?? {}),
      };

      const serializedVars = _.mapValues(globalVars, value =>
        JSON.stringify(value),
      );

      // Macro defines.
      const defineExprs = config.source.define ?? {};

      setConfig(rspackConfig, 'builtins.define', {
        ...(rspackConfig.builtins?.define ?? {}),
        ...serializedVars,
        ...defineExprs,
      });
    });
  },
});
