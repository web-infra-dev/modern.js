import { getPostcssConfig } from '@modern-js/css-config';
import { CHAIN_ID } from '@modern-js/utils';
import type { AppLegacyNormalizedConfig } from '@modern-js/app-tools';
import type WebpackChain from '@modern-js/utils/webpack-chain';

export const enableCssExtract = (config: AppLegacyNormalizedConfig) => {
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

export const createCSSRule = ({
  name,
  test,
  chain,
  config,
  genTSD,
  exclude,
  appDirectory,
  cssLoaderOptions,
}: {
  name: string;
  test: RegExp | RegExp[];
  chain: WebpackChain;
  config: AppLegacyNormalizedConfig;
  genTSD?: boolean;
  exclude?: Array<RegExp | ((path: string) => boolean)>;
  appDirectory: string;
  cssLoaderOptions: CSSLoaderOptions;
}) => {
  const postcssOptions = getPostcssConfig(appDirectory, config as any);
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
    .options(cssLoaderOptions)
    .end()
    .use(CHAIN_ID.USE.POSTCSS)
    .loader(require.resolve('../../compiled/postcss-loader'))
    .options(postcssOptions);

  // CSS imports should always be treated as sideEffects
  rule.merge({ sideEffects: true });

  if (exclude) {
    exclude.forEach(item => {
      rule.exclude.add(item);
    });
  }
};
