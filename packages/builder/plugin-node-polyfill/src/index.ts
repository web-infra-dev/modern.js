import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';

/**
 * Usage:
 *
 *   const { PluginNodePolyfill } = await import('@modern-js/builder-plugin-node-polyfill');
 *
 *   builder.addPlugins([ PluginNodePolyfill() ]);
 */
export function PluginNodePolyfill(): BuilderPlugin<BuilderPluginAPI> {
  return {
    name: 'builder-plugin-node-polyfill',

    async setup(api) {
      const { default: webpack } = await import('webpack');

      const { default: nodeLibsBrowser } = await import('node-libs-browser');

      api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
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
