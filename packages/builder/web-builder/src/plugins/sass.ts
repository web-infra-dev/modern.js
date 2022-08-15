import { SASS_REGEX } from '../shared';
import { BuilderPlugin, SassLoaderOptions } from '../types';

export function PluginSass(): BuilderPlugin {
  return {
    name: 'web-builder-plugin-sass',
    setup(api) {
      api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
        const config = api.getBuilderConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');
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
        chain.module
          .rule(CHAIN_ID.RULE.SASS)
          .test(SASS_REGEX)
          .merge({
            exclude: excludes,
            use: [
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error webpack-chain missing type
              ...chain.module.rule(CHAIN_ID.RULE.CSS).toConfig().use.values(),
              {
                loader: require.resolve('sass-loader'),
                options,
              },
            ],
          });
      });
    },
  };
}
