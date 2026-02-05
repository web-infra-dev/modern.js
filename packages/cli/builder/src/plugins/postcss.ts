import { createRequire } from 'node:module';
import { applyOptionsChain, isProd } from '@modern-js/utils';
import { type RsbuildPlugin, logger } from '@rsbuild/core';
import type { Options } from 'cssnano';
import { getCssSupport } from '../shared/getCssSupport';
import type { ToolsAutoprefixerConfig } from '../types';

const require = createRequire(import.meta.url);

const importPostcssPlugin = (name: string) =>
  Promise.resolve(require(name)) as Promise<any>;

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
        importPostcssPlugin('postcss-flexbugs-fixes'),
        !cssSupport.customProperties &&
          importPostcssPlugin('postcss-custom-properties'),
        !cssSupport.initial && importPostcssPlugin('postcss-initial'),
        !cssSupport.pageBreak && importPostcssPlugin('postcss-page-break'),
        !cssSupport.fontVariant && importPostcssPlugin('postcss-font-variant'),
        !cssSupport.mediaMinmax && importPostcssPlugin('postcss-media-minmax'),
        importPostcssPlugin('postcss-nesting'),
        enableCssMinify &&
          importPostcssPlugin('cssnano').then(cssnano =>
            cssnano(cssnanoOptions),
          ),
        // The last insert autoprefixer
        importPostcssPlugin('autoprefixer').then(autoprefixerPlugin =>
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
