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

      if (config.environments?.server) {
        compatConfig.environments ??= {};
        compatConfig.environments.server = {
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
          tools: {
            rspack: {
              optimization: {
                // Server output puts entry and async chunks in one flat
                // directory and names them `[name].js`, where an unnamed async
                // chunk falls back to its chunk id. Short hashed ids can then
                // collide with an entry name -- a two-entry app named `a` and
                // `b` hits `Conflict: Multiple assets emit different content to
                // the same filename a.js` -- so keep server chunk ids numeric.
                // Nothing caches these bundles, so compact ids buy nothing here.
                chunkIds: 'deterministic',
              },
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
        const environmentNameOrder = ['client', 'server', 'workerSSR'];

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
        const library = chain.output.get('library');
        chain.output.library({
          ...(typeof library === 'string' || Array.isArray(library)
            ? { name: library }
            : library),
          type: chain.output.get('module') === true ? 'module' : 'commonjs2',
        });
      }
    });
  },
});
