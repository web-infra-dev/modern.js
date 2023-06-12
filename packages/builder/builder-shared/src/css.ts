import assert from 'assert';
import type { AcceptedPlugin, ProcessOptions } from 'postcss';
import { getCssSupport } from './getCssSupport';
import { getSharedPkgCompiledPath as getCompiledPath } from './utils';
import { SharedNormalizedConfig } from './types';

type CssNanoOptions = {
  configFile?: string | undefined;
  preset?: [string, object] | string | undefined;
};

export const getCssnanoDefaultOptions = (): CssNanoOptions => ({
  preset: [
    'default',
    {
      // merge longhand will break safe-area-inset-top, so disable it
      // https://github.com/cssnano/cssnano/issues/803
      // https://github.com/cssnano/cssnano/issues/967
      mergeLonghand: false,
    },
  ],
});

export const getPostcssConfig = async ({
  enableCssMinify,
  enableSourceMap,
  browserslist,
  config,
}: {
  enableCssMinify: boolean;
  enableSourceMap: boolean;
  browserslist: string[];
  config: SharedNormalizedConfig;
}) => {
  const { applyOptionsChain } = await import('@modern-js/utils');

  const extraPlugins: AcceptedPlugin[] = [];

  const utils = {
    addPlugins(plugins: AcceptedPlugin | AcceptedPlugin[]) {
      if (Array.isArray(plugins)) {
        extraPlugins.push(...plugins);
      } else {
        extraPlugins.push(plugins);
      }
    },
  };

  const cssSupport = getCssSupport(browserslist);

  const mergedConfig = applyOptionsChain(
    {
      postcssOptions: {
        plugins: [
          require(getCompiledPath('postcss-flexbugs-fixes')),
          !cssSupport.customProperties &&
            require(getCompiledPath('postcss-custom-properties')),
          !cssSupport.initial && require(getCompiledPath('postcss-initial')),
          !cssSupport.pageBreak &&
            require(getCompiledPath('postcss-page-break')),
          !cssSupport.fontVariant &&
            require(getCompiledPath('postcss-font-variant')),
          !cssSupport.mediaMinmax &&
            require(getCompiledPath('postcss-media-minmax')),
          require(getCompiledPath('postcss-nesting')),
          require(getCompiledPath('autoprefixer'))(
            applyOptionsChain(
              {
                flexbox: 'no-2009',
                overrideBrowserslist: browserslist,
              },
              config.tools.autoprefixer,
            ),
          ),
          enableCssMinify
            ? require('cssnano')(getCssnanoDefaultOptions())
            : false,
        ].filter(Boolean),
      },
      sourceMap: enableSourceMap,
    },
    config.tools.postcss || {},
    utils,
  );
  if (extraPlugins.length) {
    assert('postcssOptions' in mergedConfig);
    assert('plugins' in mergedConfig.postcssOptions!);
    mergedConfig.postcssOptions.plugins!.push(...extraPlugins);
  }

  return mergedConfig as ProcessOptions & {
    postcssOptions: {
      plugins?: AcceptedPlugin[];
    };
  };
};
