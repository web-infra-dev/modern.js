import { isUseCssSourceMap, LESS_REGEX } from '@modern-js/builder-shared';
import _ from '@modern-js/utils/lodash';
import type {
  BuilderPlugin,
  FileFilterUtil,
  LessLoaderOptions,
} from '../types';

export type LessLoaderUtils = {
  addExcludes: FileFilterUtil;
};

export function PluginLess(): BuilderPlugin {
  return {
    name: 'builder-plugin-less',
    setup(api) {
      api.modifyWebpackChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');
        const { applyBaseCSSRule } = await import('./css');
        const { merge: deepMerge } = await import('@modern-js/utils/lodash');
        const getLessLoaderOptions = () => {
          const excludes: (RegExp | string)[] = [];

          const addExcludes: FileFilterUtil = items => {
            excludes.push(..._.castArray(items));
          };

          const defaultLessLoaderOptions: LessLoaderOptions = {
            lessOptions: {
              // Compat for antd or other component libraries which use math function to calculate the value
              math: 'always',
              javascriptEnabled: true,
            },
            sourceMap: isUseCssSourceMap(config),
            implementation: utils.getCompiledPath('less'),
          };
          const mergedOptions = applyOptionsChain<
            LessLoaderOptions,
            LessLoaderUtils
          >(
            defaultLessLoaderOptions,
            config.tools.less,
            { addExcludes },
            (
              defaults: LessLoaderOptions,
              userOptions: LessLoaderOptions,
            ): LessLoaderOptions => {
              return {
                ...defaults,
                ...userOptions,
                lessOptions: deepMerge(
                  defaults.lessOptions,
                  userOptions.lessOptions,
                ),
              };
            },
          );

          return {
            options: mergedOptions,
            excludes,
          };
        };

        const { options, excludes } = getLessLoaderOptions();
        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.LESS)
          .test(LESS_REGEX);

        excludes.forEach(item => {
          rule.exclude.add(item);
        });

        await applyBaseCSSRule(rule, config, api.context, utils);

        rule
          .use(utils.CHAIN_ID.USE.LESS)
          .loader(utils.getCompiledPath('less-loader'))
          .options(options);
      });
    },
  };
}
