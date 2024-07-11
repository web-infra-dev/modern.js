import type { RsbuildPlugin } from '@rsbuild/core';
import { isProd } from '@modern-js/utils';
import { getCssSupport } from '../getCssSupport';

export const pluginPostcssLegacy = (): RsbuildPlugin => ({
  name: 'uni-builder:postcss-plugins',

  setup(api) {
    api.modifyEnvironmentConfig((config, { mergeEnvironmentConfig }) => {
      if (config.output.target !== 'web') {
        return;
      }

      // only web target provides CSS outputs, so we can ignore other target
      const cssSupport = getCssSupport(config.output.overrideBrowserslist!);
      const enableExtractCSS = !config.output?.injectStyles;

      const enableCssMinify = !enableExtractCSS && isProd;

      const plugins = [
        require('postcss-flexbugs-fixes'),
        !cssSupport.customProperties && require('postcss-custom-properties'),
        !cssSupport.initial && require('postcss-initial'),
        !cssSupport.pageBreak && require('postcss-page-break'),
        !cssSupport.fontVariant && require('postcss-font-variant'),
        !cssSupport.mediaMinmax && require('postcss-media-minmax'),
        require('postcss-nesting'),
        enableCssMinify
          ? require('cssnano')({
              preset: [
                'default',
                {
                  // merge longhand will break safe-area-inset-top, so disable it
                  // https://github.com/cssnano/cssnano/issues/803
                  // https://github.com/cssnano/cssnano/issues/967
                  mergeLonghand: false,
                },
              ],
            })
          : false,
      ].filter(Boolean);

      return mergeEnvironmentConfig(
        {
          tools: {
            postcss: opts => {
              opts.postcssOptions!.plugins!.push(...plugins);
            },
          },
        },
        // user config has higher priority than builtin config
        config,
      );
    });
  },
});
