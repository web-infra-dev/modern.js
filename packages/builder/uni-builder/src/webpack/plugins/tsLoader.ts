import {
  TS_REGEX,
  JS_REGEX,
  castArray,
  mergeChainedOptions,
  applyScriptCondition,
  getBrowserslistWithDefault,
  type FileFilterUtil,
  type ChainedConfigWithUtils,
} from '@rsbuild/shared';
import {
  PluginBabelOptions,
  getBabelUtils,
  getUseBuiltIns,
} from '@rsbuild/plugin-babel';
import { getBabelConfigForWeb } from '@rsbuild/babel-preset/web';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { Options as RawTSLoaderOptions } from 'ts-loader';
import { getPresetReact } from './babel';

export type TSLoaderOptions = Partial<RawTSLoaderOptions>;

export type PluginTsLoaderOptions = ChainedConfigWithUtils<
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

    post: ['uni-builder:react'],

    setup(api) {
      api.modifyBundlerChain(async (chain, { isProd, target, CHAIN_ID }) => {
        const config = api.getNormalizedConfig();
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

        const babelLoaderOptions = mergeChainedOptions({
          defaults: baseBabelConfig,
          options: babelOptions,
          utils: babelUtils,
        });

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

        const tsLoaderOptions = mergeChainedOptions({
          defaults: tsLoaderDefaultOptions,
          // @ts-expect-error ts-loader has incorrect types for compilerOptions
          options,
          utils: tsLoaderUtils,
        });
        const rule = chain.module.rule(CHAIN_ID.RULE.TS);

        applyScriptCondition({
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
      });
    },
  };
};
