import path from 'path';
import {
  getEntryOptions,
  SERVER_RENDER_FUNCTION_NAME,
  LOADABLE_STATS_FILE,
  isUseSSRBundle,
  createRuntimeExportsUtils,
  isSSGEntry,
} from '@modern-js/utils';
import type {
  AppNormalizedConfig,
  ServerUserConfig,
  CliPlugin,
  AppTools,
} from '@modern-js/app-tools';
import type { RouterConfig } from '../../router';

const PLUGIN_IDENTIFIER = 'ssr';

const hasStringSSREntry = (userConfig: AppNormalizedConfig): boolean => {
  const isStreaming = (ssr: ServerUserConfig['ssr']) =>
    ssr && typeof ssr === 'object' && ssr.mode === 'stream';

  const { server } = userConfig;

  if (server?.ssr && !isStreaming(server.ssr)) {
    return true;
  }

  if (server?.ssrByEntries && typeof server.ssrByEntries === 'object') {
    for (const name of Object.keys(server.ssrByEntries)) {
      if (!isStreaming(server.ssrByEntries[name])) {
        return true;
      }
    }
  }

  return false;
};

export default (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-ssr',
  required: ['@modern-js/runtime'],
  setup: api => {
    const ssrConfigMap = new Map<string, any>();

    let pluginsExportsUtils: any;

    return {
      config() {
        const appContext = api.useAppContext();
        pluginsExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'plugins',
        );

        const userConfig = api.useConfigContext();
        const { bundlerType = 'webpack' } = api.useAppContext();
        // eslint-disable-next-line consistent-return
        const babelConfig = (() => {
          // In webpack build, we should let `useLoader` support CSR & SSR both.
          if (bundlerType === 'webpack') {
            return (config: any) => {
              // Add id for useLoader method,
              // The useLoader can be used even if the SSR is not enabled
              config.plugins?.push(
                path.join(__dirname, './babel-plugin-ssr-loader-id'),
              );

              if (
                isUseSSRBundle(userConfig) &&
                hasStringSSREntry(userConfig as any)
              ) {
                config.plugins?.push(require.resolve('@loadable/babel-plugin'));
              }
            };
          } else if (bundlerType === 'rspack') {
            // In Rspack build, we need transform the babel-loader again.
            // It would increase performance overhead,
            // so we only use useLoader in CSR on Rspack build temporarily.
            if (isUseSSRBundle(userConfig)) {
              return (config: any) => {
                config.plugins?.push(
                  path.join(__dirname, './babel-plugin-ssr-loader-id'),
                );
                if (hasStringSSREntry(userConfig as any)) {
                  config.plugins?.push(
                    require.resolve('@loadable/babel-plugin'),
                  );
                }
              };
            }
          }
        })();

        return {
          source: {
            alias: {
              // ensure that all packages use the same storage in @modern-js/utils/runtime-node
              '@modern-js/utils/runtime-node$': require.resolve(
                '@modern-js/utils/runtime-node',
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
            bundlerChain(chain, { isServer, isServiceWorker, CHAIN_ID }) {
              const userConfig = api.useResolvedConfigContext();

              if (
                isUseSSRBundle(userConfig) &&
                !isServer &&
                !isServiceWorker &&
                hasStringSSREntry(userConfig)
              ) {
                // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                const LoadableBundlerPlugin = require('./loadable-bundler-plugin.js');
                chain
                  .plugin(CHAIN_ID.PLUGIN.LOADABLE)
                  .use(LoadableBundlerPlugin, [
                    { filename: LOADABLE_STATS_FILE },
                  ]);
              }
            },
            babel: babelConfig,
          },
        };
      },
      modifyEntryImports({ entrypoint, imports }) {
        const { entryName, fileSystemRoutes } = entrypoint;
        const userConfig = api.useResolvedConfigContext();
        const { packageName, entrypoints } = api.useAppContext();
        pluginsExportsUtils.addExport(
          `export { default as ssr } from '@modern-js/runtime/ssr'`,
        );

        // if use ssg then set ssr config to true
        const ssrConfig = getEntryOptions(
          entryName,
          userConfig.server.ssr,
          userConfig.server.ssrByEntries,
          packageName,
        );

        if (typeof ssrConfig === 'object' && ssrConfig.mode === 'stream') {
          const runtimeConfig = getEntryOptions(
            entryName,
            userConfig.runtime,
            userConfig.runtimeByEntries,
            packageName,
          );
          if (
            (runtimeConfig?.router as RouterConfig)?.mode === 'react-router-5'
          ) {
            throw new Error(
              `router v5 plugin doesn't support streaming SSR, check your config 'runtime.router'`,
            );
          }

          if (fileSystemRoutes && !entrypoint.nestedRoutesEntry) {
            throw new Error(
              `You should switch to file-system based router to support streaming SSR.`,
            );
          }
        }

        const useSSG = isSSGEntry(userConfig, entryName, entrypoints);

        ssrConfigMap.set(entryName, ssrConfig || useSSG);
        if (ssrConfig || useSSG) {
          imports.push({
            value: '@modern-js/runtime/plugins',
            specifiers: [{ imported: PLUGIN_IDENTIFIER }],
          });
        }
        return {
          entrypoint,
          imports,
        };
      },
      modifyEntryRuntimePlugins({ entrypoint, plugins, bundlerConfigs }) {
        if (ssrConfigMap.get(entrypoint.entryName)) {
          const chunkLoadingGlobal = bundlerConfigs?.find(
            config => config.name === 'client',
          )?.output?.chunkLoadingGlobal;

          plugins.push({
            name: PLUGIN_IDENTIFIER,
            options: JSON.stringify({
              ...(ssrConfigMap.get(entrypoint.entryName) || {}),
              chunkLoadingGlobal,
            }),
          });
        }
        return {
          entrypoint,
          plugins,
        };
      },
      modifyEntryExport({ entrypoint, exportStatement }: any) {
        if (ssrConfigMap.get(entrypoint.entryName)) {
          return {
            entrypoint,
            exportStatement: [
              `export function ${SERVER_RENDER_FUNCTION_NAME}(context) {
              return bootstrap(AppWrapper, context)
            }`,
              exportStatement,
            ].join('\n'),
          };
        }
        return { entrypoint, exportStatement };
      },
    };
  },
});
