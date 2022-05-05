import Chain from 'webpack-chain';
import { getPostcssConfig } from '@modern-js/css-config';
import type { NormalizedConfig } from '@modern-js/core';

export const enableCssExtract = (config: NormalizedConfig) => {
  return config.output.disableCssExtract !== true;
};

interface CSSLoaderOptions {
  modules?:
    | boolean
    | string
    | {
        localIdentName: string;
        exportLocalsConvention:
          | 'camelCase'
          | 'asIs'
          | 'camelCaseOnly'
          | 'dashes'
          | 'dashesOnly';
      };
  importLoaders: number;
  esModule?: boolean;
  sourceMap: boolean;
}

export const createCSSRule = (
  chain: Chain,
  { appDirectory, config }: { config: NormalizedConfig; appDirectory: string },
  {
    name,
    test,
    exclude,
    genTSD,
  }: { name: string; test: RegExp; exclude?: RegExp[]; genTSD?: boolean },
  options: CSSLoaderOptions,
) => {
  const postcssOptions = getPostcssConfig(appDirectory, config);

  const loaders = chain.module.rule('loaders');
  const isExtractCSS = enableCssExtract(config);

  loaders
    .oneOf(name)
    .test(test)
    .when(isExtractCSS, c => {
      c.use('mini-css-extract')
        .loader(require('mini-css-extract-plugin').loader)
        .options(
          chain.output.get('publicPath') === './'
            ? { publicPath: '../../' }
            : {},
        )
        .end();
    })
    .when(!isExtractCSS, c => {
      c.use('style-loader').loader(require.resolve('style-loader')).end();
    })
    .when(Boolean(genTSD), c => {
      c.use('css-modules-typescript')
        .loader(require.resolve('css-modules-typescript-loader'))
        .end();
    })
    .use('css')
    .loader(require.resolve('css-loader'))
    .options(options)
    .end()
    .use('postcss')
    .loader(require.resolve('postcss-loader'))
    .options(postcssOptions);

  loaders.oneOf(name).merge({ sideEffects: true });

  if (exclude) {
    loaders.oneOf(name).exclude.add(exclude);
  }
};
