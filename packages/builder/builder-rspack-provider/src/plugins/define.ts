import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin, SourceConfig } from '../types';

export const PluginDefine = (): BuilderPlugin => ({
  name: 'builder-plugin-define',

  async setup(api) {
    api.modifyRspackConfig(async rspackConfig => {
      const config = api.getBuilderConfig();

      const builtinVars: NonNullable<SourceConfig['globalVars']> = {
        'process.env.NODE_ENV': process.env.NODE_ENV || 'development',
      };

      // Serialize global vars. User can customize value of `builtinVars`.
      const globalVars = _.assign(builtinVars, config.source?.globalVars);
      const serializedVars = _.mapValues(globalVars, value =>
        JSON.stringify(value),
      );
      // Macro defines.
      const defineExprs = config.source?.define ?? {};

      _.set(rspackConfig, 'builtins.define', {
        ...(rspackConfig.builtins?.define || {}),
        ...serializedVars,
        ...defineExprs,
      });
    });
  },
});
