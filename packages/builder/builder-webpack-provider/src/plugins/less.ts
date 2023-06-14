import {
  isUseCssSourceMap,
  LESS_REGEX,
  FileFilterUtil,
  getLessLoaderOptions,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export type LessLoaderUtils = {
  addExcludes: FileFilterUtil;
};

export function builderPluginLess(): BuilderPlugin {
  return {
    name: 'builder-plugin-less',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyBaseCSSRule } = await import('./css');

        const { options, excludes } = await getLessLoaderOptions(
          config.tools.less,
          isUseCssSourceMap(config),
        );
        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.LESS)
          .test(LESS_REGEX);

        excludes.forEach(item => {
          rule.exclude.add(item);
        });

        await applyBaseCSSRule({
          rule,
          utils,
          config,
          context: api.context,
          importLoaders: 2,
        });

        rule
          .use(utils.CHAIN_ID.USE.LESS)
          .loader(utils.getCompiledPath('less-loader'))
          .options(options);
      });
    },
  };
}
