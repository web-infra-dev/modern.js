import type { BuilderPlugin } from '@modern-js/builder';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import { isWebTarget } from '@modern-js/builder-shared';
import * as path from 'path';

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
        const getPolyfillEntry = () => {
          return path.resolve(
            api.context.cachePath,
            'rspack-node-global-polyfill.js',
          );
        };

        api.onBeforeCreateCompiler(async () => {
          if (isWebTarget(api.context.target)) {
            const fs = await import('@modern-js/utils/fs-extra');
            fs.ensureFileSync(getPolyfillEntry());
            // todo: need toggle?
            fs.writeFileSync(
              getPolyfillEntry(),
              `import { Buffer } from 'buffer';
import { process } from 'process';

globalThis.Buffer = Buffer;
globalThis.process = process;`,
            );
          }
        });

        api.modifyBundlerChain(async (chain, { isServer }) => {
          // it had not need `node polyfill`, if the target is 'node'(server runtime).
          if (isServer) {
            return;
          }

          const { entry } = api.context;

          // global polyfill workaround
          Object.keys(entry).forEach(entryName => {
            chain.entry(entryName).prepend(getPolyfillEntry());
          });

          const { default: nodeLibsBrowser } = await import(
            // @ts-expect-error
            'node-libs-browser'
          );

          chain.resolve.alias.merge(getResolveFallback(nodeLibsBrowser));
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
