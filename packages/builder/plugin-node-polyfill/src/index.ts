import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';

const getResolveFallback = (nodeLibsBrowser: any) =>
  Object.keys(nodeLibsBrowser).reduce<Record<string, string | false>>(
    (previous, name) => {
      if (nodeLibsBrowser[name]) {
        previous[name] = nodeLibsBrowser[name];
      } else {
        previous[name] = false;
      }
      return previous;
    },
    {},
  );

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
      if (api.context.bundlerType === 'rspack') {
        const polyfillFileName = 'rspack-node-global-polyfill';

        api.modifyBundlerChain(async (chain, { isServer }) => {
          // it had not need `node polyfill`, if the target is 'node'(server runtime).
          if (isServer) {
            return;
          }

          const { default: nodeLibsBrowser } = await import(
            // @ts-expect-error
            'node-libs-browser'
          );

          // TODO: global polyfill workaround, should use ProviderPlugin instead
          const { default: RspackVirtualModulePlugin } = await import(
            'rspack-plugin-virtual-module'
          );

          const { entry } = api.context;

          Object.keys(entry).forEach(entryName => {
            chain.entry(entryName).prepend(polyfillFileName);
          });

          chain
            .plugin('rspack-global-polyfill')
            .use(RspackVirtualModulePlugin, [
              {
                [polyfillFileName]: `
import { Buffer } from 'buffer';
import Process from 'process';

window.Buffer = Buffer;
window.process = Process;`,
              },
            ]);

          // module polyfill
          chain.resolve.fallback.merge(getResolveFallback(nodeLibsBrowser));
        });
        return;
      }

      api.modifyWebpackChain(async (chain, { CHAIN_ID, isServer, webpack }) => {
        // it had not need `node polyfill`, if the target is 'node'(server runtime).
        if (isServer) {
          return;
        }

        const { default: nodeLibsBrowser } = await import(
          // @ts-expect-error
          'node-libs-browser'
        );

        chain
          .plugin(CHAIN_ID.PLUGIN.NODE_POLYFILL_PROVIDE)
          .use(webpack.ProvidePlugin, [
            {
              Buffer: [nodeLibsBrowser.buffer, 'Buffer'],
              process: [nodeLibsBrowser.process],
            },
          ]);

        chain.resolve.fallback.merge(getResolveFallback(nodeLibsBrowser));
      });
    },
  };
}

/**
 * @deprecated Using builderPluginNodePolyfill instead.
 */
export const PluginNodePolyfill = builderPluginNodePolyfill;
