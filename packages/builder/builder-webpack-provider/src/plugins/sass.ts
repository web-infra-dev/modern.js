import {
  SASS_REGEX,
  getSassLoaderOptions,
  patchCompilerGlobalLocation,
  getResolveUrlJoinFn,
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

        const { options, excludes } = await getSassLoaderOptions(
          config.tools.sass,
          // source-maps required for loaders preceding resolve-url-loader
          true,
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
          // postcss-loader, resolve-url-loader, sass-loader
          importLoaders: 3,
        });

        rule
          .use(utils.CHAIN_ID.USE.RESOLVE_URL_LOADER_FOR_SASS)
          .loader(utils.getCompiledPath('resolve-url-loader'))
          .options({
            join: await getResolveUrlJoinFn(),
            // 'resolve-url-loader' relies on 'adjust-sourcemap-loader',
            // it has performance regression issues in some scenarios,
            // so we need to disable the sourceMap option.
            sourceMap: false,
          })
          .end()
          .use(utils.CHAIN_ID.USE.SASS)
          .loader(utils.getCompiledPath('sass-loader'))
          .options(options);
      });
    },
  };
}
