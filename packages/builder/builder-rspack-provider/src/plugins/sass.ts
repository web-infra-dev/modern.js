import {
  isUseCssSourceMap,
  SASS_REGEX,
  FileFilterUtil,
} from '@modern-js/builder-shared';
import _ from '@modern-js/utils/lodash';
import type { BuilderPlugin } from '../types';
import { BUILTIN_LOADER } from '../shared';

export function PluginSass(): BuilderPlugin {
  return {
    name: 'builder-plugin-sass',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');
        const { applyBaseCSSRule } = await import('./css');

        const getSassLoaderOptions = () => {
          const excludes: (RegExp | string)[] = [];

          const addExcludes: FileFilterUtil = items => {
            excludes.push(..._.castArray(items));
          };

          const mergedOptions = applyOptionsChain(
            {
              sourceMap: isUseCssSourceMap(config),
              rspackImporter: true,
            },
            config.tools.sass,
            { addExcludes },
          );

          return {
            options: mergedOptions,
            excludes,
          };
        };

        const { excludes, options } = getSassLoaderOptions();

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.SASS)
          .test(SASS_REGEX)
          .type('css');

        excludes.forEach(item => {
          rule.exclude.add(item);
        });

        await applyBaseCSSRule(rule, config, api.context, utils);

        rule
          .use(utils.CHAIN_ID.USE.SASS)
          .loader(`${BUILTIN_LOADER}sass-loader`)
          .options(options);
      });
    },
  };
}
