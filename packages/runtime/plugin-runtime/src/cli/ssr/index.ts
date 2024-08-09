import path from 'path';
import { LOADABLE_STATS_FILE, isUseSSRBundle } from '@modern-js/utils';
import type {
  AppNormalizedConfig,
  ServerUserConfig,
  CliPlugin,
  AppTools,
  PluginAPI,
} from '@modern-js/app-tools';
import type { RsbuildPlugin } from '@rsbuild/core';

const hasStringSSREntry = (userConfig: AppNormalizedConfig): boolean => {
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

const checkUseStringSSR = (config: AppNormalizedConfig): boolean => {
  const { output } = config;

  // ssg is not support streaming ssr.
  // so we assumes use String SSR when using ssg.
  return Boolean(output?.ssg) || hasStringSSREntry(config);
};

const ssrBuilderPlugin = (modernAPI: PluginAPI<AppTools>): RsbuildPlugin => ({
  name: '@modern-js/builder-plugin-ssr',

  setup(api) {
    api.modifyEnvironmentConfig((config, { name, mergeEnvironmentConfig }) => {
      const isServerEnvironment =
        config.output.target === 'node' || name === 'serviceWorker';
      const userConfig = modernAPI.useResolvedConfigContext();

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
          },
        },
        tools: {
          bundlerChain: useLoadablePlugin
            ? chain => {
                // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
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

export const ssrPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-ssr',

  required: ['@modern-js/runtime'],

  setup: api => {
    const appContext = api.useAppContext();
    return {
      // for bundle
      config() {
        const { bundlerType = 'webpack' } = api.useAppContext();
        // eslint-disable-next-line consistent-return
        const babelHandler = (() => {
          // In webpack build, we should let `useLoader` support CSR & SSR both.
          if (bundlerType === 'webpack') {
            return (config: any) => {
              const userConfig = api.useResolvedConfigContext();
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
                chain.output
                  .libraryTarget('module')
                  .set('chunkFormat', 'module');
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
      },
    };
  },
});

export default ssrPlugin;
