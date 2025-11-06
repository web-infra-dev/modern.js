import type { NormalizedEnvironmentConfig, RsbuildPlugin } from '@rsbuild/core';
import type { MinifyOptions as TerserOptions } from 'terser';
import { merge } from 'ts-deepmerge';

function applyRemoveConsole(
  options: TerserOptions,
  config: NormalizedEnvironmentConfig,
) {
  const { removeConsole } = config.performance;
  const compressOptions =
    typeof options.compress === 'boolean' ? {} : options.compress || {};

  if (removeConsole === true) {
    options.compress = {
      ...compressOptions,
      drop_console: true,
    };
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map(method => `console.${method}`);
    options.compress = {
      ...compressOptions,
      pure_funcs: pureFuncs,
    };
  }

  return options;
}

function getTerserMinifyOptions(config: NormalizedEnvironmentConfig) {
  const options: TerserOptions = {
    mangle: {
      safari10: true,
    },
    format: {
      ascii_only: config.output.charset === 'ascii',
    },
  };

  if (config.output.legalComments === 'none') {
    options.format ||= {};
    options.format.comments = false;
  }

  const finalOptions = applyRemoveConsole(options, config);
  return finalOptions;
}

function getMinifyOptions(config: NormalizedEnvironmentConfig) {
  const minifyJS: TerserOptions = getTerserMinifyOptions(config);

  return {
    removeComments: false,
    useShortDoctype: true,
    keepClosingSlash: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeEmptyAttributes: true,
    minifyJS,
    minifyCSS: true,
    minifyURLs: true,
  };
}

// support html minify and tools.htmlPlugin minify option should works
export const pluginHtmlMinifierTerser = (): RsbuildPlugin => ({
  name: 'builder:plugin-html-minifier-terser',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd, environment }) => {
      const {
        output,
        tools: { htmlPlugin },
      } = environment.config;
      const disableHtmlMinify =
        !isProd || output.minify === false || htmlPlugin === false;

      const { minify } = await import('html-minifier-terser');

      const pluginRecord = chain.plugins.entries();
      const minifyOptions = getMinifyOptions(environment.config);

      for (const id of Object.keys(pluginRecord)) {
        if (!id.startsWith('html-')) {
          continue;
        }

        const values = pluginRecord[id].values() as any[];

        const isHtmlRspackPlugin = values.some(item => {
          const name = item?.name || item.constructor?.name;
          return name === 'HtmlRspackPlugin';
        });

        if (isHtmlRspackPlugin && !disableHtmlMinify) {
          chain.plugin(id).tap(options => {
            if (!options.length) {
              return options;
            }

            const userMinifyOption = options[0].minify;

            if (userMinifyOption === false) {
              return options;
            }

            const minifyFn = (html: string) =>
              minify(
                html,
                userMinifyOption
                  ? merge(minifyOptions, userMinifyOption)
                  : minifyOptions,
              );

            options[0].minify = minifyFn;
            return options;
          });
          continue;
        }
      }
    });
  },
});
