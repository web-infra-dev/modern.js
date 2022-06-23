import { getPostcssConfig } from '@modern-js/css-config';
import { CHAIN_ID } from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';
import type WebpackChain from '@modern-js/utils/webpack-chain';

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
  chain: WebpackChain,
  { appDirectory, config }: { config: NormalizedConfig; appDirectory: string },
  {
    name,
    test,
    exclude,
    genTSD,
  }: {
    name: string;
    test: RegExp | RegExp[];
    exclude?: Array<RegExp | ((path: string) => boolean)>;
    genTSD?: boolean;
  },
  options: CSSLoaderOptions,
) => {
  const postcssOptions = getPostcssConfig(appDirectory, config);
  const loaders = chain.module.rule(CHAIN_ID.RULE.LOADERS);
  const isExtractCSS = enableCssExtract(config);
  const rule = loaders.oneOf(name);

  rule
    .test(test)
    .when(isExtractCSS, c => {
      c.use(CHAIN_ID.USE.MINI_CSS_EXTRACT)
        .loader(require('mini-css-extract-plugin').loader)
        .options(
          chain.output.get('publicPath') === './'
            ? { publicPath: '../../' }
            : {},
        )
        .end();
    })
    .when(!isExtractCSS, c => {
      c.use(CHAIN_ID.USE.STYLE).loader(require.resolve('style-loader')).end();
    })
    .when(Boolean(genTSD), c => {
      c.use(CHAIN_ID.USE.CSS_MODULES_TS)
        .loader(require.resolve('../../compiled/css-modules-typescript-loader'))
        .end();
    })
    .use(CHAIN_ID.USE.CSS)
    .loader(require.resolve('../../compiled/css-loader'))
    .options(options)
    .end()
    .use(CHAIN_ID.USE.POSTCSS)
    .loader(require.resolve('../../compiled/postcss-loader'))
    .options(postcssOptions);

  rule.merge({ sideEffects: true });

  if (exclude) {
    exclude.forEach(item => {
      rule.exclude.add(item);
    });
  }
};
