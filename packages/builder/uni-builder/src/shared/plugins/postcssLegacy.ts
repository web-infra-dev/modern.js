import type { RsbuildPlugin } from '@rsbuild/core';
import { isProd, isUseCssExtract, NormalizedConfig } from '@rsbuild/shared';
import { getCssSupport } from '../getCssSupport';

export const pluginPostcssLegacy = (
  webBrowserslist: string[],
): RsbuildPlugin => ({
  name: 'uni-builder:postcss-plugins',

  setup(api) {
    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      // only web target provides CSS outputs, so we can ignore other target
      const cssSupport = getCssSupport(webBrowserslist);
      const enableExtractCSS = isUseCssExtract(
        config as NormalizedConfig,
        'web',
      );

      const enableCssMinify = !enableExtractCSS && isProd;

      const plugins = [
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

      return mergeRsbuildConfig(config, {
        tools: {
          postcss: opts => {
            opts.postcssOptions!.plugins!.push(...plugins);
          },
        },
      });
    });
  },
});
