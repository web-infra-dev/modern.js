import type { ConfigChainWithContext } from '@rsbuild/core';
import { applyOptionsChain } from '@modern-js/utils';
import { type PluginBabelOptions, getBabelUtils } from '@rsbuild/plugin-babel';
import { getBabelConfigForWeb } from '@modern-js/babel-preset/web';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { Options as RawTSLoaderOptions } from 'ts-loader';
import { getPresetReact } from './babel';
import {
  JS_REGEX,
  TS_REGEX,
  castArray,
  applyScriptCondition,
  getBrowserslistWithDefault,
  getUseBuiltIns,
} from '../../shared/utils';

type OneOrMany<T> = T | T[];

type FileFilterUtil = (items: OneOrMany<string | RegExp>) => void;

export type TSLoaderOptions = Partial<RawTSLoaderOptions>;

export type PluginTsLoaderOptions = ConfigChainWithContext<
  TSLoaderOptions,
  {
    /**
     * use `source.include` instead
     * @deprecated
     */
    addIncludes: FileFilterUtil;
    /**
     * use `source.exclude` instead
     * @deprecated
     */
    addExcludes: FileFilterUtil;
  }
>;

export const pluginTsLoader = (
  options?: PluginTsLoaderOptions,
  babelOptions?: PluginBabelOptions['babelLoaderOptions'],
): RsbuildPlugin => {
  return {
    name: 'uni-builder:ts-loader',

    pre: ['uni-builder:babel'],

    setup(api) {
      api.modifyBundlerChain({
        order: 'pre',
        handler: async (chain, { isProd, target, CHAIN_ID, environment }) => {
          const { config } = environment;
          const { rootPath } = api.context;
          const browserslist = await getBrowserslistWithDefault(
            rootPath,
            config,
            target,
          );

          const baseBabelConfig = getBabelConfigForWeb({
            presetEnv: {
              targets: browserslist,
              useBuiltIns: getUseBuiltIns(config),
            },
          });

          baseBabelConfig.presets?.push(
            getPresetReact(api.context.rootPath, isProd),
          );

          const babelUtils = getBabelUtils(baseBabelConfig);

          const babelLoaderOptions = applyOptionsChain(
            baseBabelConfig,
            babelOptions,
            babelUtils,
          );

          const includes: Array<string | RegExp> = [];
          const excludes: Array<string | RegExp> = [];

          const tsLoaderUtils = {
            addIncludes(items: string | RegExp | (string | RegExp)[]) {
              includes.push(...castArray(items));
            },
            addExcludes(items: string | RegExp | (string | RegExp)[]) {
              excludes.push(...castArray(items));
            },
          };
          const tsLoaderDefaultOptions = {
            compilerOptions: {
              target: 'esnext',
              module: 'esnext',
            },
            transpileOnly: true,
            allowTsInNodeModules: true,
          };

          const tsLoaderOptions = applyOptionsChain(
            // @ts-expect-error ts-loader has incorrect types for compilerOptions
            tsLoaderDefaultOptions,
            options,
            tsLoaderUtils,
          );
          const rule = chain.module.rule(CHAIN_ID.RULE.TS);

          applyScriptCondition({
            chain,
            rule,
            config,
            context: api.context,
            includes,
            excludes,
          });

          // adjust babel rule to only handle JS files
          chain.module.rule(CHAIN_ID.RULE.JS).test(JS_REGEX);

          rule
            .test(TS_REGEX)
            .use(CHAIN_ID.USE.BABEL)
            .loader(require.resolve('babel-loader'))
            .options({
              ...babelLoaderOptions,
              // fix repeatedly insert babel plugin in some boundary cases
              plugins: [...(babelLoaderOptions.plugins || [])],
              presets: [...(babelLoaderOptions.presets || [])],
            })
            .end()
            .use(CHAIN_ID.USE.TS)
            .loader(require.resolve('ts-loader'))
            .options(tsLoaderOptions);
        },
      });
    },
  };
};
