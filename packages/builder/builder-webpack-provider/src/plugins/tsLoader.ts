import { TS_REGEX } from '@modern-js/builder-shared';
import _ from '@modern-js/utils/lodash';
import { BuilderPlugin } from '../types';
import { applyScriptCondition, getUseBuiltIns } from './babel';

export const builderPluginTsLoader = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-ts-loader',
    setup(api) {
      api.modifyWebpackChain(async (chain, { getCompiledPath, CHAIN_ID }) => {
        const config = api.getNormalizedConfig();
        if (!config.tools.tsLoader) {
          return;
        }

        const { rootPath } = api.context;
        const babelLoaderOptions = {
          presets: [
            [
              require.resolve('@modern-js/babel-preset-app'),
              {
                appDirectory: rootPath,
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
            includes.push(..._.castArray(items));
          },
          addExcludes(items: string | RegExp | (string | RegExp)[]) {
            excludes.push(..._.castArray(items));
          },
        };
        const { applyOptionsChain } = await import('@modern-js/utils');
        // @ts-expect-error ts-loader has incorrect types for compilerOptions
        const tsLoaderOptions = applyOptionsChain(
          {
            compilerOptions: {
              target: 'esnext',
              module: 'esnext',
            },
            transpileOnly: true,
            allowTsInNodeModules: true,
          },
          config.tools.tsLoader,
          tsLoaderUtils,
        );
        const rule = chain.module.rule(CHAIN_ID.RULE.TS);

        applyScriptCondition({
          rule,
          config,
          context: api.context,
          includes,
          excludes,
        });

        rule
          .test(TS_REGEX)
          .use(CHAIN_ID.USE.BABEL)
          .loader(getCompiledPath('babel-loader'))
          .options(babelLoaderOptions)
          .end()
          .use(CHAIN_ID.USE.TS)
          .loader(require.resolve('ts-loader'))
          .options(tsLoaderOptions);
      });
    },
  };
};
