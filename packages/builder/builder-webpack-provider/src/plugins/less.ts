import { LESS_REGEX } from '@modern-js/builder-shared';
import type { BuilderPlugin, LessLoaderOptions } from '../types';

export type LessLoaderUtils = {
  addExcludes: (excludes: RegExp | RegExp[]) => void;
};

export function PluginLess(): BuilderPlugin {
  return {
    name: 'builder-plugin-less',
    setup(api) {
      api.modifyWebpackChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');
        const { applyBaseCSSRule } = await import('./css');
        const getLessLoaderOptions = () => {
          const excludes: RegExp[] = [];

          const addExcludes = (items: RegExp | RegExp[]) => {
            if (Array.isArray(items)) {
              excludes.push(...items);
            } else {
              excludes.push(items);
            }
          };

          const defaultLessLoaderOptions = {
            lessOptions: { javascriptEnabled: true },
            sourceMap: false,
            implementation: utils.getCompiledPath('less'),
          };
          const mergedOptions = applyOptionsChain<
            LessLoaderOptions,
            LessLoaderUtils
          >(defaultLessLoaderOptions, config.tools.less, { addExcludes });

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
