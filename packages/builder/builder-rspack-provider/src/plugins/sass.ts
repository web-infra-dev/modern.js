import {
  isUseCssSourceMap,
  SASS_REGEX,
  getSassLoaderOptions,
  patchCompilerGlobalLocation,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export function builderPluginSass(): BuilderPlugin {
  return {
    name: 'builder-plugin-sass',
    async setup(api) {
      api.onAfterCreateCompiler(({ compiler }) => {
        patchCompilerGlobalLocation(compiler);
      });

      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { applyBaseCSSRule } = await import('./css');

        const { excludes, options } = await getSassLoaderOptions(
          config.tools.sass,
          isUseCssSourceMap(config),
        );

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.SASS)
          .test(SASS_REGEX);

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
          .use(utils.CHAIN_ID.USE.SASS)
          .loader(utils.getCompiledPath('sass-loader'))
          .options(options);
      });

      api.modifyRspackConfig(async rspackConfig => {
        const { applyCSSModuleRule } = await import('./css');
        const config = api.getNormalizedConfig();

        const rules = rspackConfig.module?.rules;

        applyCSSModuleRule(rules, SASS_REGEX, config);
      });
    },
  };
}
