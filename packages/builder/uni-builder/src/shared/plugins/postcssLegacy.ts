import type { RsbuildPlugin } from '@rsbuild/core';
import { getCssSupport } from '../getCssSupport';

export const pluginPostcssLegacy = (
  webBrowserslist: string[],
): RsbuildPlugin => ({
  name: 'uni-builder:postcss-legacy',

  setup(api) {
    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      const cssSupport = getCssSupport(webBrowserslist);

      const plugins = [
        !cssSupport.customProperties && require('postcss-custom-properties'),
        !cssSupport.initial && require('postcss-initial'),
        !cssSupport.pageBreak && require('postcss-page-break'),
        !cssSupport.fontVariant && require('postcss-font-variant'),
        !cssSupport.mediaMinmax && require('postcss-media-minmax'),
        require('postcss-nesting'),
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
