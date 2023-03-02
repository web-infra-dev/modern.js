import { join } from 'path';
import { BuilderPlugin } from '@modern-js/builder-shared';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';

import { BuilderOptions, createCopyPattern } from '../../shared';

/**
 * Provides default configuration consistent with modern.js v1
 */
export const builderPluginCompatModern = (
  options: BuilderOptions<'webpack'>,
): BuilderPlugin<BuilderPluginAPI> => ({
  name: 'builder-plugin-compat-modern',

  setup(api) {
    const { normalizedConfig: modernConfig, appContext } = options;

    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      // compat modern-js v1
      chain.resolve.modules
        .add('node_modules')
        .add(join(api.context.rootPath, 'node_modules'));

      // apply copy plugin
      // TODO: need enhance the copy plugin
      if (chain.plugins.has(CHAIN_ID.PLUGIN.COPY)) {
        const defaultCopyPattern = createCopyPattern(
          appContext,
          modernConfig,
          'public',
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
