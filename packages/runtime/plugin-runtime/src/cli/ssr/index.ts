import path from 'path';
import type {
  AppTools,
  AppToolsNormalizedConfig,
  CliPluginFuture,
  ServerUserConfig,
} from '@modern-js/app-tools';
import type { CLIPluginAPI } from '@modern-js/plugin-v2';
import { LOADABLE_STATS_FILE, isUseSSRBundle } from '@modern-js/utils';
import type { RsbuildPlugin } from '@rsbuild/core';

const hasStringSSREntry = (userConfig: AppToolsNormalizedConfig): boolean => {
  const isStreaming = (ssr: ServerUserConfig['ssr']) =>
    ssr && typeof ssr === 'object' && ssr.mode === 'stream';

  const { server, output } = userConfig;

  // ssg need use stringSSR.
  if ((server?.ssr || output.ssg) && !isStreaming(server.ssr)) {
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

const checkUseStringSSR = (config: AppToolsNormalizedConfig): boolean => {
  const { output } = config;

  // ssg is not support streaming ssr.
  // so we assumes use String SSR when using ssg.
  return Boolean(output?.ssg) || hasStringSSREntry(config);
};

const ssrBuilderPlugin = (
  modernAPI: CLIPluginAPI<AppTools<'shared'>>,
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

      const useLoadablePlugin =
        isUseSSRBundle(userConfig) &&
        !isServerEnvironment &&
        checkUseStringSSR(userConfig);

      return mergeEnvironmentConfig(config, {
        source: {
          define: {
            'process.env.MODERN_TARGET': isServerEnvironment
              ? JSON.stringify('node')
              : JSON.stringify('browser'),
            'process.env.MODERN_SSR_ENV': JSON.stringify(ssrEnv),
          },
        },
        tools: {
          bundlerChain: useLoadablePlugin
            ? chain => {
                const LoadableBundlerPlugin = require('./loadable-bundler-plugin.js');
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

export const ssrPlugin = (): CliPluginFuture<AppTools<'shared'>> => ({
  name: '@modern-js/plugin-ssr',

  required: ['@modern-js/runtime'],

  setup: api => {
    const appContext = api.getAppContext();

    api.config(() => {
      const { bundlerType = 'webpack' } = api.getAppContext();
      const babelHandler = (() => {
        // In webpack build, we should let `useLoader` support CSR & SSR both.
        if (bundlerType === 'webpack') {
          return (config: any) => {
            const userConfig = api.getNormalizedConfig();
            // Add id for useLoader method,
            // The useLoader can be used even if the SSR is not enabled
            config.plugins?.push(
              path.join(__dirname, './babel-plugin-ssr-loader-id'),
            );

            if (isUseSSRBundle(userConfig) && checkUseStringSSR(userConfig)) {
              config.plugins?.push(require.resolve('@loadable/babel-plugin'));
            }
          };
        } else if (bundlerType === 'rspack') {
          // In Rspack build, we need transform the babel-loader again.
          // It would increase performance overhead,
          // so we only use useLoader in CSR on Rspack build temporarily.
          return (config: any) => {
            const userConfig = api.useResolvedConfigContext();
            if (isUseSSRBundle(userConfig) && checkUseStringSSR(userConfig)) {
              config.plugins?.push(
                path.join(__dirname, './babel-plugin-ssr-loader-id'),
              );
              config.plugins?.push(require.resolve('@loadable/babel-plugin'));
            }
          };
        }
      })();

      return {
        builderPlugins: [ssrBuilderPlugin(api)],
        source: {
          alias: {
            // ensure that all packages use the same storage in @modern-js/runtime-utils/node
            '@modern-js/runtime-utils/node$': require.resolve(
              '@modern-js/runtime-utils/node',
            ),
          },
        },
        tools: {
          babel: babelHandler,
          bundlerChain: (chain, { isServer }) => {
            if (isServer && appContext.moduleType === 'module') {
              chain.output.libraryTarget('module').set('chunkFormat', 'module');
              chain.output.library({
                type: 'module',
              });
              chain.experiments({
                ...chain.get('experiments'),
                outputModule: true,
              });
            }
          },
        },
      };
    });
  },
});

export default ssrPlugin;
