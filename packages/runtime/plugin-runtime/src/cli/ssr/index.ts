import path from 'path';
import type {
  AppTools,
  AppToolsNormalizedConfig,
  CliPlugin,
  ServerUserConfig,
} from '@modern-js/app-tools';
import type { CLIPluginAPI } from '@modern-js/plugin';
import type { Entrypoint } from '@modern-js/types';
import {
  LOADABLE_STATS_FILE,
  isUseSSRBundle,
  tryResolve,
} from '@modern-js/utils';
import type { RsbuildPlugin } from '@rsbuild/core';
import LoadableBundlerPlugin from './loadable-bundler-plugin';
import { resolveSSRMode } from './mode';

const hasStringSSREntry = (userConfig: AppToolsNormalizedConfig): boolean => {
  const isStreaming = (ssr: ServerUserConfig['ssr']) =>
    ssr && typeof ssr === 'object' && ssr.mode === 'stream';

  const { server, output } = userConfig;

  // ssg need use stringSSR.
  if (output?.ssg) {
    return true;
  }

  if (output?.ssgByEntries && Object.keys(output.ssgByEntries).length > 0) {
    return true;
  }

  if (server?.ssr && !isStreaming(server.ssr)) {
    return true;
  }

  if (server?.ssrByEntries && typeof server.ssrByEntries === 'object') {
    for (const name of Object.keys(server.ssrByEntries)) {
      if (
        server.ssrByEntries[name] &&
        !isStreaming(server.ssrByEntries[name])
      ) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Check if any entry uses string SSR mode.
 * Returns true if at least one entry uses 'string' SSR mode.
 */
const checkUseStringSSR = (
  config: AppToolsNormalizedConfig,
  appDirectory?: string,
  entrypoints?: Entrypoint[],
): boolean => {
  // If entrypoints are provided, check each entry
  if (entrypoints && entrypoints.length > 0) {
    for (const entrypoint of entrypoints) {
      const ssrMode = resolveSSRMode({
        entry: entrypoint.entryName,
        config,
        appDirectory,
        nestedRoutesEntry: entrypoint.nestedRoutesEntry,
      });
      if (ssrMode === 'string') {
        return true;
      }
    }
    return false;
  }

  return true;
};

const ssrBuilderPlugin = (
  modernAPI: CLIPluginAPI<AppTools>,
  outputModule: boolean,
): RsbuildPlugin => ({
  name: '@modern-js/builder-plugin-ssr',

  setup(api) {
    api.modifyEnvironmentConfig((config, { name, mergeEnvironmentConfig }) => {
      const isServerEnvironment =
        config.output.target === 'node' || name === 'workerSSR';
      const userConfig = modernAPI.getNormalizedConfig();

      // Maybe we can enable it for node 18 and above, but we can't ensure it in the compilation.
      const ssrEnv =
        userConfig.deploy?.worker?.ssr || userConfig.server?.rsc
          ? 'edge'
          : 'node';

      const appContext = modernAPI.getAppContext();
      const { appDirectory, entrypoints } = appContext;

      const useLoadablePlugin =
        isUseSSRBundle(userConfig) &&
        !isServerEnvironment &&
        checkUseStringSSR(userConfig, appDirectory, entrypoints);

      return mergeEnvironmentConfig(config, {
        source: {
          define: {
            'process.env.MODERN_TARGET': isServerEnvironment
              ? JSON.stringify('node')
              : JSON.stringify('browser'),
            'process.env.MODERN_SSR_ENV': JSON.stringify(ssrEnv),
          },
        },
        output: {
          module: isServerEnvironment && outputModule,
        },
        tools: {
          bundlerChain: useLoadablePlugin
            ? chain => {
                chain
                  .plugin('loadable')
                  .use(LoadableBundlerPlugin, [
                    { filename: LOADABLE_STATS_FILE },
                  ]);
              }
            : undefined,
        },
      });
    });
  },
});

export const ssrPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-ssr',

  required: ['@modern-js/runtime'],

  setup: api => {
    const appContext = api.getAppContext();
    const exportLoadablePath = `@${appContext.metaName}/runtime/loadable`;
    const runtimeUtilsPath = require.resolve('@modern-js/runtime-utils/node');
    const aliasPath = runtimeUtilsPath
      .replace(`${path.sep}cjs${path.sep}`, `${path.sep}esm${path.sep}`)
      .replace(/\.js$/, '.mjs');

    api.config(() => {
      return {
        builderPlugins: [
          ssrBuilderPlugin(api, appContext.moduleType === 'module'),
        ],
        resolve: {
          alias: {
            // ensure that all packages use the same storage in @modern-js/runtime-utils/node
            '@modern-js/runtime-utils/node$': aliasPath,
          },
        },
        tools: {
          swc: {
            jsc: {
              experimental: {
                plugins: [
                  [
                    require.resolve('@swc/plugin-loadable-components'),
                    {
                      signatures: [
                        { name: 'default', from: '@loadable/component' },
                        { name: 'lazy', from: '@loadable/component' },
                        {
                          name: 'default',
                          from: exportLoadablePath,
                        },
                        {
                          name: 'lazy',
                          from: exportLoadablePath,
                        },
                      ],
                    },
                  ],
                ],
              },
            },
          },
        },
      };
    });
  },
});

export default ssrPlugin;
