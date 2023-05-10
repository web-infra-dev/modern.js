import { setConfig } from '@modern-js/builder-shared';
import type {
  BuilderPlugin,
  NormalizedConfig,
  RspackConfig,
  RspackBuiltinsConfig,
} from '../types';

export async function applyJSMinimizer(
  rspackConfig: RspackConfig,
  config: NormalizedConfig,
) {
  const options: RspackBuiltinsConfig['minifyOptions'] = {};

  const { removeConsole } = config.performance;

  if (removeConsole === true) {
    options.dropConsole = true;
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map(method => `console.${method}`);
    options.pureFuncs = pureFuncs;
  }

  switch (config.output.legalComments) {
    case 'inline':
      options.extractComments = false;
      break;
    case 'linked':
      options.extractComments = true;
      break;
    case 'none':
      // todo
      // options.terserOptions!.format!.comments = false;
      options.extractComments = false;
      break;
    default:
      break;
  }

  setConfig(rspackConfig, 'builtins.minifyOptions', options);
}

export const builderPluginMinimize = (): BuilderPlugin => ({
  name: 'builder-plugin-minimize',

  setup(api) {
    api.modifyRspackConfig(async (rspackConfig, { isProd }) => {
      const config = api.getNormalizedConfig();
      const isMinimize = isProd && !config.output.disableMinimize;

      // set minimize to allow users to disable minimize
      setConfig(rspackConfig, 'optimization.minimize', isMinimize);

      if (isMinimize) {
        await applyJSMinimizer(rspackConfig, config);
      }
    });
  },
});
