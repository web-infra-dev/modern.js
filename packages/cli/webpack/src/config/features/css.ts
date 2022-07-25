import { CHAIN_ID, isProd } from '@modern-js/utils';
import {
  CSS_REGEX,
  GLOBAL_CSS_REGEX,
  CSS_MODULE_REGEX,
} from '../../utils/constants';
import { createCSSRule, enableCssExtract } from '../../utils/createCSSRule';
import { ChainUtils, isNodeModulesCss } from '../shared';

export function applyCSSLoaders({ chain, config, appContext }: ChainUtils) {
  const disableCssModuleExtension =
    config.output?.disableCssModuleExtension ?? false;
  const isExtractCSS = enableCssExtract(config);
  const enableSourceMap =
    isProd() && isExtractCSS && !config.output?.disableSourceMap;

  // CSS modules
  createCSSRule({
    chain,
    config,
    name: CHAIN_ID.ONE_OF.CSS_MODULES,
    test: disableCssModuleExtension ? CSS_REGEX : CSS_MODULE_REGEX,
    genTSD: config.output?.enableCssModuleTSDeclaration,
    exclude: disableCssModuleExtension
      ? [isNodeModulesCss, GLOBAL_CSS_REGEX]
      : [],
    appDirectory: appContext.appDirectory,
    cssLoaderOptions: {
      importLoaders: 1,
      modules: {
        localIdentName: config.output
          ? config.output.cssModuleLocalIdentName!
          : '',
        exportLocalsConvention: 'camelCase',
      },
      sourceMap: enableSourceMap,
    },
  });

  // CSS (not modules)
  createCSSRule({
    chain,
    name: CHAIN_ID.ONE_OF.CSS,
    test: CSS_REGEX,
    config,
    appDirectory: appContext.appDirectory,
    cssLoaderOptions: {
      importLoaders: 1,
      sourceMap: enableSourceMap,
    },
  });
}

export function applyCSSExtractPlugin({
  chain,
  cssChunkName,
}: ChainUtils & {
  cssChunkName: string;
}) {
  const MiniCssExtractPlugin = require('mini-css-extract-plugin');

  chain.plugin(CHAIN_ID.PLUGIN.MINI_CSS_EXTRACT).use(MiniCssExtractPlugin, [
    {
      filename: cssChunkName,
      chunkFilename: cssChunkName,
      ignoreOrder: true,
    },
  ]);
}
