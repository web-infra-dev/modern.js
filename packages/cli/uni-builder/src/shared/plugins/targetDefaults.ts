import type { RsbuildPlugin } from '@rsbuild/core';
import type { DistPath } from '../../types';
import { join } from 'node:path';
import { getBrowserslistWithDefault } from '../utils';

export const pluginTargetDefaults = (
  distPath: DistPath = {},
): RsbuildPlugin => ({
  name: 'uni-builder:target-defaults-plugin',

  setup(api) {
    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      if (config.environments?.serviceWorker) {
        config = mergeRsbuildConfig(
          {
            environments: {
              serviceWorker: {
                output: {
                  distPath: {
                    root: join(
                      distPath.root || 'dist',
                      distPath.worker || 'worker',
                    ),
                  },
                },
              },
            },
          },
          config,
        );
      }

      if (config.environments?.node) {
        config = mergeRsbuildConfig(
          {
            environments: {
              node: {
                output: {
                  // no need to emit assets for SSR bundles
                  emitAssets: false,
                  distPath: {
                    root: join(
                      distPath.root || 'dist',
                      distPath.server || 'bundles',
                    ),
                  },
                },
              },
            },
          },
          config,
        );
      }

      return config;
    });
    api.modifyEnvironmentConfig(async (config, { name }) => {
      config.output.overrideBrowserslist ??= await getBrowserslistWithDefault(
        api.context.rootPath,
        config,
        name === 'serviceWorker' ? 'node' : config.output.target,
      );
    });
  },
});
