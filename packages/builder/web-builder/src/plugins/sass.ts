import { SASS_REGEX } from '../shared';
import { BuilderPlugin, SassLoaderOptions } from '../types';

export function PluginSass(): BuilderPlugin {
  return {
    name: 'web-builder-plugin-sass',
    setup(api) {
      api.modifyWebpackChain(async (chain, utils) => {
        const config = api.getBuilderConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');
        const { applyBaseCSSRule } = await import('./css');

        const getSassLoaderOptions = () => {
          const excludes: RegExp[] = [];

          const addExcludes = (items: RegExp | RegExp[]) => {
            if (Array.isArray(items)) {
              excludes.push(...items);
            } else {
              excludes.push(items);
            }
          };

          const mergedOptions = applyOptionsChain<
            SassLoaderOptions,
            { addExcludes: (excludes: RegExp | RegExp[]) => void }
          >(
            {
              sourceMap: false,
            },
            config.tools?.sass || {},
            { addExcludes },
          );

          return {
            options: mergedOptions,
            excludes,
          };
        };
        const { options, excludes } = getSassLoaderOptions();
        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.SASS)
          .test(SASS_REGEX)
          .exclude.add(excludes)
          .end();
        await applyBaseCSSRule(rule, config, api.context, utils);
        rule
          .use(utils.CHAIN_ID.USE.SASS)
          .loader(require.resolve('sass-loader'))
          .options(options);
      });
    },
  };
}
