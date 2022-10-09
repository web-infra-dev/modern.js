import { TS_REGEX } from '../shared';
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
      const config = api.getBuilderConfig();
      if (!config.tools?.tsLoader) {
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
      api.modifyWebpackChain(async (chain, { getCompiledPath }) => {
        const { CHAIN_ID, applyOptionsChain } = await import(
          '@modern-js/utils'
        );
        const tsLoaderOptions = applyOptionsChain(
          {
            compilerOptions: {
              target: ScriptTarget.ESNext,
              module: ModuleKind.ESNext,
            },
            transpileOnly: true,
            allowTsInNodeModules: true,
          },
          config.tools?.tsLoader || {},
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
