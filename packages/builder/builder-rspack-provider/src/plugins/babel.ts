import { mergeRegex, JS_REGEX, TS_REGEX } from '@modern-js/builder-shared';
import { cloneDeep, isEqual } from '@modern-js/utils/lodash';
import { BuilderPlugin, NormalizedConfig } from '../types';
import type { BabelOptions } from '@modern-js/types';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS } from '@modern-js/utils';

export const builderPluginBabel = (): BuilderPlugin => ({
  name: 'builder-plugin-babel',

  pre: ['builder-plugin-swc'],

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, isProd, getCompiledPath }) => {
        const config = api.getNormalizedConfig();
        if (!config.tools.babel) {
          // we would not use babel loader in rspack, unless user need to use.
          return;
        }

        const { applyUserBabelConfig } = await import('@modern-js/utils');

        const getBabelOptions = (config: NormalizedConfig) => {
          // 1. Create babel utils function about include/exclude,
          const includes: Array<string | RegExp> = [];
          const excludes: Array<string | RegExp> = [];

          const babelUtils = {
            addIncludes(items: string | RegExp | Array<string | RegExp>) {
              if (Array.isArray(items)) {
                includes.push(...items);
              } else {
                includes.push(items);
              }
            },
            addExcludes(items: string | RegExp | Array<string | RegExp>) {
              if (Array.isArray(items)) {
                excludes.push(...items);
              } else {
                excludes.push(items);
              }
            },
          };

          const baseConfig = {
            plugins: [],
            presets: [
              // todo: only apply preset-typescript for ts file (isTSX & allExtensions false)
              [
                require.resolve('@babel/preset-typescript'),
                DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS,
              ],
            ],
          };

          const userBabelConfig = applyUserBabelConfig(
            cloneDeep(baseConfig),
            config.tools.babel,
            babelUtils,
          );

          const notModify = isEqual(baseConfig, userBabelConfig);

          if (notModify) {
            return {};
          }

          const babelOptions: BabelOptions = {
            babelrc: false,
            configFile: false,
            compact: isProd,
            ...userBabelConfig,
          };

          return {
            babelOptions,
            includes,
            excludes,
          };
        };

        const {
          babelOptions,
          includes = [],
          excludes = [],
        } = getBabelOptions(config);

        if (!babelOptions) {
          return;
        }

        // already set source.include / exclude in plugin-swc
        const rule = chain.module.rule(CHAIN_ID.RULE.JS);

        const { rootPath } = api.context;

        rule
          .test(mergeRegex(JS_REGEX, TS_REGEX))
          .use(CHAIN_ID.USE.BABEL)
          .after(CHAIN_ID.USE.SWC)
          .loader(getCompiledPath('babel-loader'))
          .options({
            ...babelOptions,
            only: [
              (pathName: string) =>
                pathName.includes(rootPath) && !/node_modules/.test(pathName),
              ...includes,
            ],
            ignore: excludes,
          });
      },
    );
  },
});
