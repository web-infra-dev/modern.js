import type { CopyPluginOptions, BuilderPlugin } from '../types';

export const builderPluginCopy = (): BuilderPlugin => ({
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

    api.modifyWebpackConfig(async config => {
      const copyPlugin = config.plugins?.find(
        item => item.constructor.name === 'CopyPlugin',
      ) as unknown as CopyPluginOptions;

      if (copyPlugin) {
        const { fs } = await import('@modern-js/utils');

        // If the pattern.context directory not exists, we should remove CopyPlugin.
        // Otherwise the CopyPlugin will cause the webpack to re-compile.
        const isContextNotExists = copyPlugin.patterns.every(
          pattern =>
            typeof pattern !== 'string' &&
            pattern.context &&
            !fs.existsSync(pattern.context),
        );
        if (isContextNotExists) {
          config.plugins = config.plugins?.filter(
            item => item.constructor.name !== 'CopyPlugin',
          );
        }
      }
    });
  },
});
