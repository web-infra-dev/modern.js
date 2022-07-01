import { applyOptionsChain, CHAIN_ID } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import type WebpackChain from '@modern-js/utils/webpack-chain';
import { TS_REGEX } from '../../utils/constants';
import { getUseBuiltIns } from '../../utils/getBabelOptions';
import { applyScriptCondition } from './babel-loader';

export function applyTsLoader({
  config,
  loaders,
  metaName,
  appContext,
}: {
  config: NormalizedConfig;
  loaders: WebpackChain.Rule<WebpackChain.Module>;
  metaName: string;
  appContext: IAppContext;
}) {
  const babelLoaderOptions = {
    presets: [
      [
        require.resolve('@modern-js/babel-preset-app'),
        {
          metaName,
          appDirectory: appContext.appDirectory,
          target: 'client',
          useTsLoader: true,
          useBuiltIns: getUseBuiltIns(config),
          userBabelConfig: config.tools.babel,
        },
      ],
    ],
  };

  const includes: Array<string | RegExp> = [];
  const excludes: Array<string | RegExp> = [];

  const tsLoaderUtils = {
    addIncludes(items: string | RegExp | (string | RegExp)[]) {
      if (Array.isArray(items)) {
        includes.push(...items);
      } else {
        includes.push(items);
      }
    },
    addExcludes(items: string | RegExp | (string | RegExp)[]) {
      if (Array.isArray(items)) {
        excludes.push(...items);
      } else {
        excludes.push(items);
      }
    },
  };

  const tsLoaderOptions = applyOptionsChain(
    {
      compilerOptions: {
        target: 'es5',
        module: 'ESNext',
      },
      transpileOnly: false,
      allowTsInNodeModules: true,
    },
    config.tools?.tsLoader || {},
    tsLoaderUtils,
  );

  const rule = loaders.oneOf(CHAIN_ID.ONE_OF.TS).test(TS_REGEX);

  applyScriptCondition({
    rule,
    includes,
    excludes,
    appContext,
    config,
  });

  rule
    .use(CHAIN_ID.USE.BABEL)
    .loader(require.resolve('../../../compiled/babel-loader'))
    .options(babelLoaderOptions)
    .end()
    .use(CHAIN_ID.USE.TS)
    .loader(require.resolve('ts-loader'))
    .options(tsLoaderOptions);
}
