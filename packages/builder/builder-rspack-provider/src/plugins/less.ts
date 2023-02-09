import type { BuilderPlugin } from '../types';
import {
  isUseCssSourceMap,
  LESS_REGEX,
  FileFilterUtil,
} from '@modern-js/builder-shared';
import _ from '@modern-js/utils/lodash';

export function builderPluginLess(): BuilderPlugin {
  return {
    name: 'builder-plugin-less',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');
        const { applyBaseCSSRule } = await import('./css');

        const getLessLoaderOptions = () => {
          const excludes: (RegExp | string)[] = [];

          const addExcludes: FileFilterUtil = items => {
            excludes.push(..._.castArray(items));
          };

          const defaultLessLoaderOptions = {
            lessOptions: {
              javascriptEnabled: true,
            },
            sourceMap: isUseCssSourceMap(config),
            implementation: utils.getCompiledPath('less'),
          };
          const mergedOptions = applyOptionsChain(
            defaultLessLoaderOptions,
            config.tools.less,
            { addExcludes },
          );

          return {
            options: mergedOptions,
            excludes,
          };
        };

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.LESS)
          .test(LESS_REGEX)
          .type('css');

        await applyBaseCSSRule(rule, config, api.context, utils);

        const { excludes, options } = getLessLoaderOptions();

        excludes.forEach(item => {
          rule.exclude.add(item);
        });

        await applyBaseCSSRule(rule, config, api.context, utils);

        rule
          .use(utils.CHAIN_ID.USE.LESS)
          .loader(utils.getCompiledPath('@rspack/less-loader'))
          .options(options);
      });
    },
  };
}
