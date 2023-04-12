import {
  mergeRegex,
  getSharedPkgCompiledPath,
  applyScriptCondition,
  JS_REGEX,
  TS_REGEX,
} from '@modern-js/builder-shared';
import { BuilderPlugin, NormalizedConfig } from '../types';
import type { BabelOptions } from '@modern-js/types';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS } from '@modern-js/utils/constants';

export const builderPluginBabel = (): BuilderPlugin => ({
  name: 'builder-plugin-babel',
  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
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

        const babelOptions: BabelOptions = {
          babelrc: false,
          configFile: false,
          compact: isProd,
          ...applyUserBabelConfig(
            {
              plugins: [],
              presets: [
                [
                  require.resolve('@babel/preset-typescript'),
                  DEFAULT_BABEL_PRESET_TYPESCRIPT_OPTIONS,
                ],
              ],
            },
            config.tools.babel,
            babelUtils,
          ),
        };

        return {
          babelOptions,
          includes,
          excludes,
        };
      };

      const { babelOptions, includes, excludes } = getBabelOptions(config);

      const rule = chain.module.rule(CHAIN_ID.RULE.JS);

      applyScriptCondition({
        rule,
        config,
        context: api.context,
        includes,
        excludes,
      });

      rule
        .test(mergeRegex(JS_REGEX, TS_REGEX))
        .use(CHAIN_ID.USE.BABEL)
        .loader(getSharedPkgCompiledPath('babel-loader'))
        .options(babelOptions);
    });
  },
});
