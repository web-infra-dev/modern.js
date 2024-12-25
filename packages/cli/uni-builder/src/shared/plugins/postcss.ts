import { applyOptionsChain, isProd } from '@modern-js/utils';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { Options } from 'cssnano';
import type { ToolsAutoprefixerConfig } from '../../types';
import { getCssSupport } from '../getCssSupport';

export interface CssNanoOptimizeOptions {
  mergeLonghand?: boolean;
  /**
   * normalizeUrl will transform relative url from `./assets/img.svg` to `assets/img.svg`.
   * It may break the behavior of webpack resolver while using style-loader.
   * So disable it while `output.injectStyles = true` or `output.disableCssExtract = true`.
   */
  normalizeUrl?: boolean;
}

export interface PluginPostcssOptions {
  autoprefixer?: ToolsAutoprefixerConfig;
  cssnanoOptimize?: CssNanoOptimizeOptions;
}

// enable autoprefixer and  support compat legacy browsers
export const pluginPostcss = (
  options: PluginPostcssOptions = {},
): RsbuildPlugin => ({
  name: 'uni-builder:postcss-plugins',

  pre: ['uni-builder:environment-defaults-plugin'],

  setup(api) {
    const { autoprefixer, cssnanoOptimize = {} } = options;
    api.modifyEnvironmentConfig((config, { mergeEnvironmentConfig }) => {
      if (config.output.target !== 'web') {
        return config;
      }

      // only web target provides CSS outputs, so we can ignore other target
      const cssSupport = getCssSupport(config.output.overrideBrowserslist!);
      const enableExtractCSS = !config.output?.injectStyles;

      const enableCssMinify = !enableExtractCSS && isProd;

      const cssnanoOptions: Options = {
        preset: [
          'default',
          {
            // merge longhand will break safe-area-inset-top, so disable it
            // https://github.com/cssnano/cssnano/issues/803
            // https://github.com/cssnano/cssnano/issues/967
            mergeLonghand: false,
            ...cssnanoOptimize,
          },
        ],
      };

      const plugins = [
        require('postcss-flexbugs-fixes'),
        !cssSupport.customProperties && require('postcss-custom-properties'),
        !cssSupport.initial && require('postcss-initial'),
        !cssSupport.pageBreak && require('postcss-page-break'),
        !cssSupport.fontVariant && require('postcss-font-variant'),
        !cssSupport.mediaMinmax && require('postcss-media-minmax'),
        require('postcss-nesting'),
        enableCssMinify ? require('cssnano')(cssnanoOptions) : false,
        // The last insert autoprefixer
        require('autoprefixer')(
          applyOptionsChain(
            {
              flexbox: 'no-2009',
              overrideBrowserslist: config.output.overrideBrowserslist!,
            },
            autoprefixer,
          ),
        ),
      ].filter(Boolean);

      return mergeEnvironmentConfig(
        {
          tools: {
            postcss: {
              postcssOptions: {
                plugins,
              },
            },
          },
        },
        // user config has higher priority than builtin config
        config,
      );
    });
  },
});
