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

      const { fs } = await import('@modern-js/utils');
      const { default: CopyPlugin } = await import(
        '../../compiled/copy-webpack-plugin'
      );

      const options: CopyPluginOptions = Array.isArray(copy)
        ? { patterns: copy }
        : copy;

      // If the pattern.context directory not exists, we should not use CopyPlugin.
      // Otherwise the CopyPlugin will cause the webpack to re-compile.
      const isContextNotExists = options.patterns.every(
        pattern =>
          typeof pattern !== 'string' &&
          pattern.context &&
          !fs.existsSync(pattern.context),
      );
      if (isContextNotExists) {
        return;
      }

      chain.plugin(CHAIN_ID.PLUGIN.COPY).use(CopyPlugin, [options]);
    });
  },
});
