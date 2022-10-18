import { type BuilderContext } from '@modern-js/builder-shared';
import { getBrowserslistWithDefault } from '../shared';
import {
  BuilderConfig,
  BuilderPlugin,
  ModifyRspackUtils,
  RspackConfig,
} from '../types';

import type { AcceptedPlugin, ProcessOptions } from 'postcss';
import postcssLoader from '../loader/postcss';

export const CSS_REGEX_STR = '\\.css$';

export async function applyBaseCSSRule(
  rspackConfig: RspackConfig,
  config: BuilderConfig,
  context: BuilderContext,
  utils: ModifyRspackUtils,
) {
  const { isServer, isProd, CHAIN_ID, getCompiledPath } = utils;
  const browserslist = await getBrowserslistWithDefault(
    context.rootPath,
    config,
  );
  const enableSourceMap = isProd && !config.output?.disableSourceMap;

  const getPostcssConfig = () => {
    const extraPlugins: AcceptedPlugin[] = [];
    const enableCssMinify = isProd;

    const mergedConfig = {
      postcssOptions: {
        plugins: [
          require(getCompiledPath('postcss-flexbugs-fixes')),
          require(getCompiledPath('postcss-custom-properties')),
          require(getCompiledPath('postcss-initial')),
          require(getCompiledPath('postcss-page-break')),
          require(getCompiledPath('postcss-font-variant')),
          require(getCompiledPath('postcss-media-minmax')),
          require(getCompiledPath('postcss-nesting')),
          require(getCompiledPath('autoprefixer'))({
            flexbox: 'no-2009',
            overrideBrowserslist: browserslist,
          }),
          enableCssMinify ? require('cssnano')({ preset: 'default' }) : false,
        ].filter(Boolean),
      },
      modules: {
        auto: true
      },
      sourceMap: enableSourceMap,
    };

    if (extraPlugins.length) {
      mergedConfig.postcssOptions!.plugins!.push(...extraPlugins);
    }

    return mergedConfig as ProcessOptions & {
      postcssOptions: {
        plugins?: AcceptedPlugin[];
      };
    };
  };

  const postcssLoaderOptions = getPostcssConfig();

  rspackConfig.module!.rules!.push({
    test: CSS_REGEX_STR,
    uses: [
      {
        loader: postcssLoader,
        options: postcssLoaderOptions,
      },
    ],
    type: 'css',
  });
}

export const PluginCss = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-css',
    setup(api) {
      api.modifyRspackConfig(async (rspackConfig, utils) => {
        const config = api.getBuilderConfig();
        await applyBaseCSSRule(rspackConfig, config, api.context, utils);
      });
    },
  };
};
