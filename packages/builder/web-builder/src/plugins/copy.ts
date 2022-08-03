import type { CopyPluginOptions, WebBuilderPlugin } from '../types';

export const PluginCopy = (): WebBuilderPlugin => ({
  name: 'web-builder-plugin-copy',

  setup(api) {
    api.modifyWebpackChain(async chain => {
      const config = api.getBuilderConfig();
      const { copy } = config.output || {};

      if (!copy) {
        return;
      }

      const { CHAIN_ID } = await import('@modern-js/utils');
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
