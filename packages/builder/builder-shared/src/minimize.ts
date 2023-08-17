import { SharedNormalizedConfig, TerserPluginOptions } from './types';

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
