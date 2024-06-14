import {
  CHAIN_ID,
  type RspackChain,
  type RsbuildPlugin,
  type NormalizedConfig,
} from '@rsbuild/shared';
import { applyOptionsChain } from '@modern-js/utils';
import { TerserPluginOptions, ToolsTerserConfig } from '../../types';

function applyRemoveConsole(
  options: TerserPluginOptions,
  config: NormalizedConfig,
) {
  const { removeConsole } = config.performance;
  const compressOptions =
    typeof options.terserOptions!.compress === 'boolean'
      ? {}
      : options.terserOptions!.compress || {};

  if (removeConsole === true) {
    options.terserOptions!.compress = {
      ...compressOptions,
      drop_console: true,
    };
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map(method => `console.${method}`);
    options.terserOptions!.compress = {
      ...compressOptions,
      pure_funcs: pureFuncs,
    };
  }

  return options;
}

async function applyJSMinimizer(
  chain: RspackChain,
  config: NormalizedConfig,
  userTerserConfig?: ToolsTerserConfig,
) {
  const { default: TerserPlugin } = await import('terser-webpack-plugin');

  const DEFAULT_OPTIONS: TerserPluginOptions = {
    terserOptions: {
      mangle: {
        safari10: true,
      },
      format: {
        ascii_only: config.output.charset === 'ascii',
      },
    },
  };

  applyRemoveConsole(DEFAULT_OPTIONS, config);

  switch (config.output.legalComments) {
    case 'inline':
      DEFAULT_OPTIONS.extractComments = false;
      break;
    case 'linked':
      DEFAULT_OPTIONS.extractComments = true;
      break;
    case 'none':
      DEFAULT_OPTIONS.terserOptions!.format!.comments = false;
      DEFAULT_OPTIONS.extractComments = false;
      break;
    default:
      break;
  }

  const mergedOptions = applyOptionsChain(DEFAULT_OPTIONS, userTerserConfig);

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.JS)
    .use(TerserPlugin, [
      // Due to terser-webpack-plugin has changed the type of class, which using a generic type in
      // constructor, leading auto inference of parameters of plugin constructor is not possible, using any instead
      mergedOptions as any,
    ])
    .end();
}

export const pluginMinimize = (
  userTerserConfig?: ToolsTerserConfig,
): RsbuildPlugin => ({
  name: 'uni-builder:minimize',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const { minify } = config.output;

      if (minify === false || !isProd) {
        return;
      }

      if (minify === true || minify?.js !== false) {
        await applyJSMinimizer(chain, config, userTerserConfig);
      }
    });
  },
});
