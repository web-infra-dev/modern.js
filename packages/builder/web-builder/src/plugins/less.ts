import { LESS_REGEX } from '../shared';
import { BuilderPlugin, LessLoaderOptions } from '../types';

export function PluginLess(): BuilderPlugin {
  return {
    name: 'web-builder-plugin-less',
    setup(api) {
      api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
        const config = api.getBuilderConfig();
        const { applyOptionsChain } = await import('@modern-js/utils');
        const getLessLoaderOptions = () => {
          const excludes: RegExp[] = [];

          const addExcludes = (items: RegExp | RegExp[]) => {
            if (Array.isArray(items)) {
              excludes.push(...items);
            } else {
              excludes.push(items);
            }
          };

          const mergedOptions = applyOptionsChain<
            LessLoaderOptions,
            { addExcludes: (excludes: RegExp | RegExp[]) => void }
          >(
            {
              lessOptions: { javascriptEnabled: true },
              sourceMap: false,
            },
            config.tools?.less || {},
            { addExcludes },
          );

          return {
            options: mergedOptions,
            excludes,
          };
        };
        const { options, excludes } = getLessLoaderOptions();
        chain.module
          .rule(CHAIN_ID.RULE.LESS)
          .test(LESS_REGEX)
          .merge({
            exclude: excludes,
            use: [
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error webpack-chain missing type
              ...chain.module.rule(CHAIN_ID.RULE.CSS).toConfig().use.values(),
              {
                loader: require.resolve('less-loader'),
                options,
              },
            ],
          });
      });
    },
  };
}
