import { setConfig } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI as WebpackBuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import type { BuilderPluginAPI as RspackBuilderPluginAPI } from '@modern-js/builder-rspack-provider';

const getResolveFallback = (nodeLibs: Record<string, any>) =>
  Object.keys(nodeLibs).reduce<Record<string, string | false>>(
    (previous, name) => {
      if (nodeLibs[name]) {
        previous[name] = nodeLibs[name];
      } else {
        previous[name] = false;
      }
      return previous;
    },
    {},
  );

const getProvideLibs = async () => {
  const { default: nodeLibs } = await import(
    // @ts-expect-error
    'node-libs-browser'
  );
  return {
    Buffer: [nodeLibs.buffer, 'Buffer'],
    process: [nodeLibs.process],
  };
};

/**
 * Usage:
 *
 *   const { builderPluginNodePolyfill } = await import('@modern-js/builder-plugin-node-polyfill');
 *
 *   builder.addPlugins([ builderPluginNodePolyfill() ]);
 */
export function builderPluginNodePolyfill(): BuilderPlugin<
  WebpackBuilderPluginAPI | RspackBuilderPluginAPI
> {
  return {
    name: 'builder-plugin-node-polyfill',

    async setup(api) {
      api.modifyBundlerChain(async (chain, { isServer }) => {
        // it had not need `node polyfill`, if the target is 'node'(server runtime).
        if (isServer) {
          return;
        }

        const { default: nodeLibs } = await import(
          // @ts-expect-error
          'node-libs-browser'
        );

        // module polyfill
        chain.resolve.fallback.merge(getResolveFallback(nodeLibs));
      });

      if (api.context.bundlerType === 'rspack') {
        (api as RspackBuilderPluginAPI).modifyRspackConfig(
          async (config, { isServer }) => {
            if (isServer) {
              return;
            }
            setConfig(config, 'builtins.provide', {
              ...(config.builtins?.provide ?? {}),
              ...(await getProvideLibs()),
            });
          },
        );
      } else {
        (api as WebpackBuilderPluginAPI).modifyWebpackChain(
          async (chain, { CHAIN_ID, isServer, webpack }) => {
            if (isServer) {
              return;
            }
            chain
              .plugin(CHAIN_ID.PLUGIN.NODE_POLYFILL_PROVIDE)
              .use(webpack.ProvidePlugin, [await getProvideLibs()]);
          },
        );
      }
    },
  };
}

/**
 * @deprecated Using builderPluginNodePolyfill instead.
 */
export const PluginNodePolyfill = builderPluginNodePolyfill;
