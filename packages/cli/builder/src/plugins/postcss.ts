import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyOptionsChain, isProd } from '@modern-js/utils';
import { type RsbuildPlugin, logger } from '@rsbuild/core';
import type { Options } from 'cssnano';
import { getCssSupport } from '../shared/getCssSupport';
import type { ToolsAutoprefixerConfig } from '../types';

const builderRequire = createRequire(import.meta.url);

const createRootRequire = (rootPath: string) =>
  createRequire(pathToFileURL(path.join(rootPath, 'package.json')).href);

export const loadPostcssPlugin = (name: string, appRootPath: string) => {
  const resolvers = [
    builderRequire,
    createRootRequire(appRootPath),
    createRootRequire(process.cwd()),
  ];

  let firstError: unknown = null;

  for (const resolveWith of resolvers) {
    try {
      return resolveWith(name);
    } catch (error) {
      firstError ??= error;
    }
  }

  throw firstError;
};

const importPostcssPlugin = (name: string, appRootPath: string) =>
  Promise.resolve(loadPostcssPlugin(name, appRootPath)) as Promise<any>;

export interface PluginPostcssOptions {
  autoprefixer?: ToolsAutoprefixerConfig;
}

// enable autoprefixer and  support compat legacy browsers
export const pluginPostcss = (
  options: PluginPostcssOptions = {},
): RsbuildPlugin => ({
  name: 'builder:postcss-plugins',

  pre: ['builder:environment-defaults-plugin'],

  setup(api) {
    const { autoprefixer } = options;
    api.modifyEnvironmentConfig(async (config, { mergeEnvironmentConfig }) => {
      if (config.output.target !== 'web') {
        return config;
      }

      // only web target provides CSS outputs, so we can ignore other target
      const cssSupport = getCssSupport(config.output.overrideBrowserslist!);
      const enableExtractCSS = !config.output?.injectStyles;

      const enableCssMinify = !enableExtractCSS && isProd();

      const cssnanoOptions: Options = {
        preset: [
          'default',
          {
            // merge longhand will break safe-area-inset-top, so disable it
            // https://github.com/cssnano/cssnano/issues/803
            // https://github.com/cssnano/cssnano/issues/967
            mergeLonghand: false,
            /**
             * normalizeUrl will transform relative url from `./assets/img.svg` to `assets/img.svg`.
             * It may break the behavior of webpack resolver while using style-loader.
             * So disable it while `output.injectStyles = true`
             */
            normalizeUrl: false,
          },
        ],
      };

      const plugins = await Promise.all([
        importPostcssPlugin('postcss-flexbugs-fixes', api.context.rootPath),
        !cssSupport.customProperties &&
          importPostcssPlugin(
            'postcss-custom-properties',
            api.context.rootPath,
          ),
        !cssSupport.initial &&
          importPostcssPlugin('postcss-initial', api.context.rootPath),
        !cssSupport.pageBreak &&
          importPostcssPlugin('postcss-page-break', api.context.rootPath),
        !cssSupport.fontVariant &&
          importPostcssPlugin('postcss-font-variant', api.context.rootPath),
        !cssSupport.mediaMinmax &&
          importPostcssPlugin('postcss-media-minmax', api.context.rootPath),
        importPostcssPlugin('postcss-nesting', api.context.rootPath),
        enableCssMinify &&
          importPostcssPlugin('cssnano', api.context.rootPath).then(cssnano =>
            cssnano(cssnanoOptions),
          ),
        // The last insert autoprefixer
        importPostcssPlugin('autoprefixer', api.context.rootPath).then(
          autoprefixerPlugin =>
            autoprefixerPlugin(
              applyOptionsChain(
                {
                  flexbox: 'no-2009',
                  overrideBrowserslist: config.output.overrideBrowserslist!,
                },
                autoprefixer,
              ),
            ),
        ),
      ]).then(results => results.filter(Boolean));

      return mergeEnvironmentConfig(
        {
          tools: {
            postcss: opts => {
              if (typeof opts.postcssOptions === 'function') {
                logger.warn(
                  'unexpected function type postcssOptions, the default postcss plugins will not be applied.',
                );
                return opts;
              }
              opts.postcssOptions ??= {};
              opts.postcssOptions.plugins ??= [];
              opts.postcssOptions.plugins.push(...plugins);
            },
          },
        },
        // user config has higher priority than builtin config
        config,
      );
    });
  },
});
