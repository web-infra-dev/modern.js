import type { CopyPluginOptions, BuilderPlugin } from '../types';

export const PluginCopy = (): BuilderPlugin => ({
  name: 'builder-plugin-copy',

  setup(api) {
    api.modifyWebpackChain(async (chain, { CHAIN_ID }) => {
      const config = api.getNormalizedConfig();
      const { copy } = config.output;

      if (!copy) {
        return;
      }

      const { default: CopyPlugin } = await import(
        '../../compiled/copy-webpack-plugin'
      );

      const options: CopyPluginOptions = Array.isArray(copy)
        ? { patterns: copy }
        : copy;

      chain.plugin(CHAIN_ID.PLUGIN.COPY).use(CopyPlugin, [options]);
    });
  },
});
