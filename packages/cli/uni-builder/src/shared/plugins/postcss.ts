import type { RsbuildPlugin } from '@rsbuild/core';
import type { ToolsAutoprefixerConfig } from '../../types';
import { isProd, applyOptionsChain } from '@modern-js/utils';
import { getCssSupport } from '../getCssSupport';

// enable autoprefixer and  support compat legacy browsers
export const pluginPostcss = ({
  autoprefixer,
}: {
  autoprefixer?: ToolsAutoprefixerConfig;
}): RsbuildPlugin => ({
  name: 'uni-builder:postcss-plugins',

  setup(api) {
    api.modifyEnvironmentConfig({
      order: 'post',
      handler: (config, { mergeEnvironmentConfig }) => {
        if (config.output.target !== 'web') {
          return config;
        }

        // only web target provides CSS outputs, so we can ignore other target
        const cssSupport = getCssSupport(config.output.overrideBrowserslist!);
        const enableExtractCSS = !config.output?.injectStyles;

        const enableCssMinify = !enableExtractCSS && isProd;

        const enableAutoprefixer = config.tools.lightningcssLoader === false;

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
          // The last insert autoprefixer
          enableAutoprefixer &&
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
      },
    });
  },
});
