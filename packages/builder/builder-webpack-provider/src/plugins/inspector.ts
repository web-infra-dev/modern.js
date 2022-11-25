import type { BuilderPlugin } from '../types';

/**
 * Provide webpack inspector.
 */
export const PluginInspector = (): BuilderPlugin => ({
  name: 'builder-plugin-inspector',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      if (!config.tools.inspector) {
        return;
      }
      const { applyOptionsChain } = await import('@modern-js/utils');
      const inspectorOptions = applyOptionsChain(
        {
          port: 3333,
          ignorePattern: /node_modules/,
        },
        config.tools.inspector,
      );
      // `@modern-js/inspector-webpack-plugin` has been prebundled.
      const { InspectorWebpackPlugin } = await import(
        '@modern-js/inspector-webpack-plugin'
      );
      chain
        .plugin(CHAIN_ID.PLUGIN.INSPECTOR)
        .use(InspectorWebpackPlugin, [inspectorOptions]);
    });
  },
});
