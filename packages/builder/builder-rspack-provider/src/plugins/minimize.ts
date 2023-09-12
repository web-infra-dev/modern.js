import { CHAIN_ID } from '@modern-js/utils/chain-id';
import { applyCSSMinimizer, BundlerChain } from '@modern-js/builder-shared';
import type {
  BuilderPlugin,
  NormalizedConfig,
  RspackBuiltinsConfig,
} from '../types';
import { SwcJsMinimizerRspackPlugin } from '@rspack/core';

export async function applyJSMinimizer(
  chain: BundlerChain,
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
      options.comments = 'some';
      options.extractComments = false;
      break;
    case 'linked':
      options.extractComments = true;
      break;
    case 'none':
      options.comments = false;
      options.extractComments = false;
      break;
    default:
      break;
  }

  options.asciiOnly = config.output.charset === 'ascii';

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.JS)
    .use(SwcJsMinimizerRspackPlugin, [options])
    .end();
}

export const builderPluginMinimize = (): BuilderPlugin => ({
  name: 'builder-plugin-minimize',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const isMinimize = isProd && !config.output.disableMinimize;

      // set minimize to allow users to disable minimize
      chain.optimization.minimize(isMinimize);

      if (isMinimize) {
        await applyJSMinimizer(chain, config);
        await applyCSSMinimizer(chain, config);
      }
    });
  },
});
