import Chain from 'webpack-chain';
import { getPostcssConfig } from '@modern-js/css-config';
import { NormalizedConfig } from '@modern-js/core';

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
          | 'dashsOnly';
      };
  importLoaders: number;
  esModule?: boolean;
  sourceMap: boolean;
}

export const createCSSRule = (
  chain: Chain,
  { appDirectory, config }: { config: NormalizedConfig; appDirectory: string },
  { name, test, exclude }: { name: string; test: RegExp; exclude?: RegExp[] },
  options: CSSLoaderOptions,
) => {
  const postcssOptions = getPostcssConfig(appDirectory, config);

  const loaders = chain.module.rule('loaders');

  loaders
    .oneOf(name)
    .test(test)
    .use('mini-css-extract')
    .loader(require('mini-css-extract-plugin').loader)
    .options(
      chain.output.get('publicPath') === './' ? { publicPath: '../../' } : {},
    )
    .end()
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
