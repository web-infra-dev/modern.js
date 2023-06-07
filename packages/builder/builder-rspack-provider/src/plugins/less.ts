import type { BuilderPlugin } from '../types';
import {
  isUseCssSourceMap,
  LESS_REGEX,
  getLessLoaderOptions,
} from '@modern-js/builder-shared';

export function builderPluginLess(): BuilderPlugin {
  return {
    name: 'builder-plugin-less',
    setup(api) {
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyBaseCSSRule } = await import('./css');

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.LESS)
          .test(LESS_REGEX)
          .type('css');

        await applyBaseCSSRule(rule, config, api.context, utils);

        const { excludes, options } = await getLessLoaderOptions(
          config.tools.less,
          isUseCssSourceMap(config),
        );

        excludes.forEach(item => {
          rule.exclude.add(item);
        });

        await applyBaseCSSRule(rule, config, api.context, utils);

        rule
          .use(utils.CHAIN_ID.USE.LESS)
          .loader(utils.getCompiledPath('less-loader'))
          .options(options);
      });

      api.modifyRspackConfig(async rspackConfig => {
        const { applyCSSModuleRule } = await import('./css');
        const config = api.getNormalizedConfig();

        const rules = rspackConfig.module?.rules;

        applyCSSModuleRule(
          rules,
          LESS_REGEX,
          config.output.disableCssModuleExtension,
          config.output.cssModules,
        );
      });
    },
  };
}
