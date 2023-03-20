import { BuilderPluginAPI } from '@modern-js/builder-rspack-provider';
import { BuilderPlugin } from '@modern-js/builder-shared';

export const builderPluginNodePolyfill =
  (): BuilderPlugin<BuilderPluginAPI> => ({
    name: 'builder-plugin-node-polyfill',

    async setup(api) {
      api.modifyBundlerChain(async (chain, { isServer }) => {
        // it had not need `node polyfill`, if the target is 'node'(server runtime).
        if (isServer) {
          return;
        }

        const { default: NodePolyfill } = await import(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          '@rspack/plugin-node-polyfill'
        );

        chain.plugin('node-polyfill').use(NodePolyfill);
      });
    },
  });
