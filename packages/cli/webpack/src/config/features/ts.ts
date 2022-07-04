import { resolve } from 'path';
import { chalk, applyOptionsChain, CHAIN_ID } from '@modern-js/utils';
import { TS_REGEX } from '../../utils/constants';
import { getUseBuiltIns } from '../../utils/getBabelOptions';
import type { ChainUtils } from '../shared';
import { applyScriptCondition } from './babel';

export function applyTsLoader({ config, loaders, appContext }: ChainUtils) {
  const babelLoaderOptions = {
    presets: [
      [
        require.resolve('@modern-js/babel-preset-app'),
        {
          metaName: appContext.metaName,
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

export function applyTsCheckerPlugin({ chain, appContext }: ChainUtils) {
  const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

  chain.plugin(CHAIN_ID.PLUGIN.TS_CHECKER).use(ForkTsCheckerWebpackPlugin, [
    {
      typescript: {
        // avoid OOM issue
        memoryLimit: 8192,
        // use tsconfig of user project
        configFile: resolve(appContext.appDirectory, './tsconfig.json'),
        // use typescript of user project
        typescriptPath: require.resolve('typescript'),
      },
      // only display error messages
      logger: {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        log() {},
        error(message: string) {
          console.error(chalk.red.bold('TYPE'), message);
        },
      },
      issue: {
        include: [{ file: '**/src/**/*' }],
        exclude: [
          { file: '**/*.(spec|test).ts' },
          { file: '**/node_modules/**/*' },
        ],
      },
    },
  ]);
}
