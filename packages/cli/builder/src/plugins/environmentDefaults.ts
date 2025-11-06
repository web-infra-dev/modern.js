import { join } from 'node:path';
import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import {
  SERVICE_WORKER_ENVIRONMENT_NAME,
  getBrowserslistWithDefault,
} from '../shared/utils';
import type { DistPath } from '../types';

export const pluginEnvironmentDefaults = (
  distPath: DistPath = {},
): RsbuildPlugin => ({
  name: 'builder:environment-defaults-plugin',

  setup(api) {
    api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
      const compatConfig: RsbuildConfig = {};
      if (config.environments?.[SERVICE_WORKER_ENVIRONMENT_NAME]) {
        compatConfig.environments ??= {};
        compatConfig.environments[SERVICE_WORKER_ENVIRONMENT_NAME] = {
          output: {
            polyfill: 'off',
            distPath: {
              root: join(distPath.root || 'dist', distPath.worker || 'worker'),
              js: '',
              css: '',
              jsAsync: '',
              cssAsync: '',
            },
            filename: {
              js: '[name].js',
            },
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
    // ensure environment order to avoid match unexpected environment resources
    // https://github.com/web-infra-dev/rsbuild/issues/2956
    api.modifyRsbuildConfig({
      handler: config => {
        const environmentNameOrder = ['web', 'node', 'workerSSR'];

        config.environments = Object.fromEntries(
          Object.entries(config.environments!).sort((a1, a2) =>
            environmentNameOrder.includes(a1[0])
              ? environmentNameOrder.indexOf(a1[0]) -
                environmentNameOrder.indexOf(a2[0])
              : 1,
          ),
        );
      },
      order: 'post',
    });
    api.modifyEnvironmentConfig(async (config, { name }) => {
      config.output.overrideBrowserslist ??= await getBrowserslistWithDefault(
        api.context.rootPath,
        config,
        name === SERVICE_WORKER_ENVIRONMENT_NAME
          ? 'node'
          : config.output.target,
      );
    });

    api.modifyBundlerChain(async (chain, { environment }) => {
      const isServiceWorker =
        environment.name === SERVICE_WORKER_ENVIRONMENT_NAME;

      if (isServiceWorker) {
        chain.output.libraryTarget('commonjs2');
      }
    });
  },
});
