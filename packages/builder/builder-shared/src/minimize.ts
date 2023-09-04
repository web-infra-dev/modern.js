import {
  SharedNormalizedConfig,
  TerserPluginOptions,
  BundlerChain,
  CssMinimizerPluginOptions,
} from './types';
import { getCssnanoDefaultOptions } from './css';

function applyRemoveConsole(
  options: TerserPluginOptions,
  config: SharedNormalizedConfig,
) {
  if (!options.terserOptions) {
    options.terserOptions = {};
  }

  const { removeConsole } = config.performance;
  const compressOptions =
    typeof options.terserOptions.compress === 'boolean'
      ? {}
      : options.terserOptions.compress || {};

  if (removeConsole === true) {
    options.terserOptions.compress = {
      ...compressOptions,
      drop_console: true,
    };
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map(method => `console.${method}`);
    options.terserOptions.compress = {
      ...compressOptions,
      pure_funcs: pureFuncs,
    };
  }

  return options;
}

export async function getJSMinifyOptions(config: SharedNormalizedConfig) {
  const { applyOptionsChain } = await import('@modern-js/utils');

  const DEFAULT_OPTIONS: TerserPluginOptions = {
    terserOptions: {
      mangle: {
        // not need in rspack(swc)
        // https://github.com/swc-project/swc/discussions/3373
        safari10: true,
      },
      format: {
        ascii_only: config.output.charset === 'ascii',
      },
    },
  };

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

  const mergedOptions = applyOptionsChain(
    DEFAULT_OPTIONS,
    // @ts-expect-error
    config.tools.terser,
  );

  const finalOptions = applyRemoveConsole(mergedOptions, config);

  return finalOptions;
}

export async function applyCSSMinimizer(
  chain: BundlerChain,
  config: SharedNormalizedConfig,
) {
  const { CHAIN_ID, applyOptionsChain } = await import('@modern-js/utils');
  const { default: CssMinimizerPlugin } = await import(
    'css-minimizer-webpack-plugin'
  );

  const mergedOptions: CssMinimizerPluginOptions = applyOptionsChain(
    {
      minimizerOptions: getCssnanoDefaultOptions(),
    },
    config.tools.minifyCss,
  );

  chain.optimization
    .minimizer(CHAIN_ID.MINIMIZER.CSS)
    .use(CssMinimizerPlugin, [
      // Due to css-minimizer-webpack-plugin has changed the type of class, which using a generic type in
      // constructor, leading auto inference of parameters of plugin constructor is not possible, using any instead
      mergedOptions,
    ])
    .end();
}
