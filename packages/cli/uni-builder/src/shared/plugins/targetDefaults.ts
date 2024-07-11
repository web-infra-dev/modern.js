import type { RsbuildPlugin, RsbuildConfig } from '@rsbuild/core';
import type { DistPath } from '../../types';
import { join } from 'node:path';
import { getBrowserslistWithDefault } from '../utils';

export const pluginTargetDefaults = (
  distPath: DistPath = {},
): RsbuildPlugin => ({
  name: 'uni-builder:target-defaults-plugin',

  setup(api) {
    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      const compatConfig: RsbuildConfig = {};
      if (config.environments?.serviceWorker) {
        compatConfig.environments ??= {};
        compatConfig.environments.serviceWorker = {
          output: {
            distPath: {
              root: join(distPath.root || 'dist', distPath.worker || 'worker'),
              js: '',
              css: '',
              jsAsync: '',
              cssAsync: '',
            },
            filenameHash: false,
          },
        };
      }

      if (config.environments?.node) {
        compatConfig.environments ??= {};
        compatConfig.environments.node = {
          output: {
            // no need to emit assets for SSR bundles
            emitAssets: false,
            distPath: {
              root: join(distPath.root || 'dist', distPath.server || 'bundles'),
              js: '',
              css: '',
              jsAsync: '',
              cssAsync: '',
            },
          },
        };
      }

      return compatConfig.environments
        ? mergeRsbuildConfig(compatConfig, config)
        : config;
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
