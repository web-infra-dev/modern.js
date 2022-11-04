import { TS_REGEX } from '@modern-js/builder-shared';
import _ from '@modern-js/utils/lodash';
import { BuilderPlugin } from '../types';
import { applyScriptCondition, getUseBuiltIns } from './babel';

// Declare `ScriptTarget` and `ModuleKind` manualy to avoid high cost of typescript import
enum ScriptTarget {
  ESNext = 99,
}

enum ModuleKind {
  ESNext = 99,
}

export const PluginTsLoader = (): BuilderPlugin => {
  return {
    name: 'builder-plugin-ts-loader',
    setup(api) {
      api.modifyWebpackChain(async (chain, { getCompiledPath, CHAIN_ID }) => {
        const config = api.getNormalizedConfig();
        if (!config.tools.tsLoader) {
          return;
        }

        const { framework, rootPath } = api.context;
        const babelLoaderOptions = {
          presets: [
            [
              require.resolve('@modern-js/babel-preset-app'),
              {
                metaName: framework,
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
        const tsLoaderOptions = applyOptionsChain(
          {
            compilerOptions: {
              target: ScriptTarget.ESNext,
              module: ModuleKind.ESNext,
            },
            transpileOnly: true,
            allowTsInNodeModules: true,
          },
          config.tools.tsLoader,
          tsLoaderUtils,
        );
        const rule = chain.module.rule(CHAIN_ID.RULE.TS);

        applyScriptCondition(rule, config, api.context, includes, excludes);

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
