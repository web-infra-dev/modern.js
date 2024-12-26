import { applyOptionsChain, isProd } from '@modern-js/utils';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { ToolsAutoprefixerConfig } from '../../types';
import { getCssSupport } from '../getCssSupport';

// enable autoprefixer and  support compat legacy browsers
export const pluginPostcss = ({
  autoprefixer,
}: {
  autoprefixer?: ToolsAutoprefixerConfig;
}): RsbuildPlugin => ({
  name: 'uni-builder:postcss-plugins',

  pre: ['uni-builder:environment-defaults-plugin'],

  setup(api) {
    api.modifyEnvironmentConfig((config, { mergeEnvironmentConfig }) => {
      if (config.output.target !== 'web') {
        return config;
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
            postcss: opts => {
              if (typeof opts.postcssOptions === 'object') {
                opts.postcssOptions.plugins!.push(...plugins);
                return;
              } else if (typeof opts.postcssOptions === 'function') {
                const originFn = opts.postcssOptions;
                opts.postcssOptions = loaderContext => {
                  const options = originFn(loaderContext);
                  options.plugins!.push(...plugins);
                  return options;
                };
                return;
              }
            },
          },
        },
        // user config has higher priority than builtin config
        config,
      );
    });
  },
});
