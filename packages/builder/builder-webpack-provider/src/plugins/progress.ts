import { BuilderTarget } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

const ID_MAP: Record<BuilderTarget, string> = {
  web: 'Client',
  node: 'Server',
  'modern-web': 'Modern',
};

export const PluginProgress = (): BuilderPlugin => ({
  name: 'builder-plugin-progress',
  setup(api) {
    api.modifyWebpackChain(async (chain, { target, CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const options = config.dev.progressBar;
      if (!options) {
        return;
      }

      const { ProgressPlugin } = await import(
        '../webpackPlugins/ProgressPlugin/ProgressPlugin'
      );
      chain.plugin(CHAIN_ID.PLUGIN.PROGRESS).use(ProgressPlugin, [
        {
          id: ID_MAP[target],
          ...(options === true ? {} : options),
        },
      ]);
    });
  },
});
