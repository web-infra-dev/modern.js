import { join } from 'path';
import { BuilderPlugin } from '@modern-js/builder-shared';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';
import { BuilderOptions } from '../shared';
import { createPublicPattern } from './createCopyPattern';

/**
 * Provides default configuration consistent with modern.js v1
 */
export const builderPluginAdapterModern = (
  options: BuilderOptions<'webpack'>,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-adapter-modern',

  setup(api) {
    const { normalizedConfig: modernConfig, appContext } = options;

    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      // compat modern-js v1
      chain.resolve.modules
        .add('node_modules')
        .add(join(api.context.rootPath, 'node_modules'));

      // apply copy plugin
      if (chain.plugins.has(CHAIN_ID.PLUGIN.COPY)) {
        const defaultCopyPattern = createPublicPattern(
          appContext,
          modernConfig,
          chain,
        );
        chain.plugin(CHAIN_ID.PLUGIN.COPY).tap(args => [
          {
            patterns: [...(args[0]?.patterns || []), defaultCopyPattern],
          },
        ]);
      }
    });
  },
});
