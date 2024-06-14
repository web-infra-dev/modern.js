import path from 'path';
import {
  LOADABLE_STATS_FILE,
  isUseSSRBundle,
  createRuntimeExportsUtils,
} from '@modern-js/utils';
import type {
  AppNormalizedConfig,
  ServerUserConfig,
  CliPlugin,
  AppTools,
} from '@modern-js/app-tools';

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

export const ssrPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-ssr',

  required: ['@modern-js/runtime'],

  setup: api => {
    let pluginsExportsUtils: any;

    return {
      config() {
        const appContext = api.useAppContext();

        pluginsExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'plugins',
        );

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
          source: {
            alias: {
              // ensure that all packages use the same storage in @modern-js/runtime-utils/node
              '@modern-js/runtime-utils/node$': require.resolve(
                '@modern-js/runtime-utils/node',
              ),
              '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
            },
            globalVars: (values, { target }) => {
              values['process.env.MODERN_TARGET'] =
                target === 'node' || target === 'service-worker'
                  ? 'node'
                  : 'browser';
            },
          },
          tools: {
            bundlerChain(chain, { isServer, isServiceWorker }) {
              const userConfig = api.useResolvedConfigContext();

              if (
                isUseSSRBundle(userConfig) &&
                !isServer &&
                !isServiceWorker &&
                checkUseStringSSR(userConfig)
              ) {
                // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                const LoadableBundlerPlugin = require('./loadable-bundler-plugin.js');
                chain
                  .plugin('loadable')
                  .use(LoadableBundlerPlugin, [
                    { filename: LOADABLE_STATS_FILE },
                  ]);
              }
            },
            babel: babelHandler,
          },
        };
      },
    };
  },
});

export default ssrPlugin;
