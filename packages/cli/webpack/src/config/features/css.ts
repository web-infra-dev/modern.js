import { CHAIN_ID, isProd } from '@modern-js/utils';
import {
  CSS_REGEX,
  GLOBAL_CSS_REGEX,
  CSS_MODULE_REGEX,
} from '../../utils/constants';
import { createCSSRule } from '../../utils/createCSSRule';
import { ChainUtils, isNodeModulesCss } from '../shared';

export function applyCSSLoaders({ chain, config, appContext }: ChainUtils) {
  const disableCssModuleExtension =
    config.output?.disableCssModuleExtension ?? false;

  // CSS modules
  createCSSRule(
    chain,
    {
      config,
      appDirectory: appContext.appDirectory,
    },
    {
      name: CHAIN_ID.ONE_OF.CSS_MODULES,
      test: disableCssModuleExtension ? CSS_REGEX : CSS_MODULE_REGEX,
      exclude: disableCssModuleExtension
        ? [isNodeModulesCss, GLOBAL_CSS_REGEX]
        : [],
      genTSD: config.output?.enableCssModuleTSDeclaration,
    },
    {
      importLoaders: 1,
      esModule: false,
      modules: {
        localIdentName: config.output
          ? config.output.cssModuleLocalIdentName!
          : '',
        exportLocalsConvention: 'camelCase',
      },
      sourceMap: isProd() && !config.output?.disableSourceMap,
    },
  );

  // CSS (not modules)
  createCSSRule(
    chain,
    {
      config,
      appDirectory: appContext.appDirectory,
    },
    {
      name: CHAIN_ID.ONE_OF.CSS,
      test: CSS_REGEX,
    },
    {
      importLoaders: 1,
      esModule: false,
      sourceMap: isProd() && !config.output?.disableSourceMap,
    },
  );
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
