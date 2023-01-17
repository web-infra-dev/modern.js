import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';

/**
 * Usage:
 *
 *   const { builderPluginNodePolyfill } = await import('@modern-js/builder-plugin-node-polyfill');
 *
 *   builder.addPlugins([ builderPluginNodePolyfill() ]);
 */
export function builderPluginNodePolyfill(): BuilderPlugin<BuilderPluginAPI> {
  return {
    name: 'builder-plugin-node-polyfill',

    async setup(api) {
      api.modifyWebpackChain(async (chain, { CHAIN_ID, isServer, webpack }) => {
        // it had not need `node polyfill`, if the target is 'node'(server runtime).
        if (isServer) {
          return;
        }

        // @ts-expect-error
        const { default: nodeLibsBrowser } = await import('node-libs-browser');

        chain
          .plugin(CHAIN_ID.PLUGIN.NODE_POLYFILL_PROVIDE)
          .use(webpack.ProvidePlugin, [
            {
              Buffer: [nodeLibsBrowser.buffer, 'Buffer'],
              process: [nodeLibsBrowser.process],
            },
          ]);

        const fallback = Object.keys(nodeLibsBrowser).reduce<
          Record<string, string | false>
        >((previous, name) => {
          if (nodeLibsBrowser[name]) {
            previous[name] = nodeLibsBrowser[name];
          } else {
            previous[name] = false;
          }
          return previous;
        }, {});

        chain.resolve.fallback.merge(fallback);
      });
    },
  };
}

/**
 * @deprecated Using builderPluginNodePolyfill instead.
 */
export const PluginNodePolyfill = builderPluginNodePolyfill;
