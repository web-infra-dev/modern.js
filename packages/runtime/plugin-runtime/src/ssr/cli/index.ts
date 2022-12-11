import path from 'path';
import {
  getEntryOptions,
  SERVER_RENDER_FUNCTION_NAME,
  LOADABLE_STATS_FILE,
  isUseSSRBundle,
  createRuntimeExportsUtils,
  isSingleEntry,
} from '@modern-js/utils';
import type {
  AppNormalizedConfig,
  ServerUserConfig,
  SSGMultiEntryOptions,
  CliPlugin,
  AppTools,
} from '@modern-js/app-tools';

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

        return {
          source: {
            alias: {
              '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
            },
          },
          tools: {
            webpackChain: (chain, { name, isServer, CHAIN_ID }) => {
              const userConfig = api.useResolvedConfigContext();

              if (
                isUseSSRBundle(userConfig) &&
                name !== 'server' &&
                hasStringSSREntry(userConfig)
              ) {
                // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
                const LoadableWebpackPlugin = require('@loadable/webpack-plugin');
                chain
                  .plugin(CHAIN_ID.PLUGIN.LOADABLE)
                  .use(LoadableWebpackPlugin, [
                    { filename: LOADABLE_STATS_FILE },
                  ]);
              }

              // add environment variables to determine the node/browser
              const prefix = `${
                appContext.metaName.split(/[-_]/)[0]
              }_`.toUpperCase();
              const modernVars = {
                [`process.env.${prefix}TARGET`]: JSON.stringify(
                  isServer ? 'node' : 'browser',
                ),
              };
              chain.plugin(CHAIN_ID.PLUGIN.DEFINE).tap(args => {
                const [vars, ...rest] = args;
                return [
                  {
                    ...vars,
                    ...modernVars,
                  },
                  ...rest,
                ];
              });
            },

            babel: (config: any) => {
              const userConfig = api.useResolvedConfigContext();
              if (isUseSSRBundle(userConfig)) {
                config.plugins.push(
                  path.join(__dirname, './babel-plugin-ssr-loader-id'),
                );

                if (hasStringSSREntry(userConfig)) {
                  config.plugins.push(
                    require.resolve('@loadable/babel-plugin'),
                  );
                }
              }
            },
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
          if (runtimeConfig?.router?.legacy) {
            throw new Error(
              `Legacy router plugin doesn't support streaming SSR, check your config 'runtime.router'`,
            );
          }

          if (fileSystemRoutes && !entrypoint.nestedRoutesEntry) {
            throw new Error(
              `You should switch to file-system based router to support streaming SSR.`,
            );
          }
        }

        const ssgConfig = userConfig.output.ssg;
        const useSSG = isSingleEntry(entrypoints)
          ? Boolean(ssgConfig)
          : ssgConfig === true ||
            typeof (ssgConfig as Array<unknown>)?.[0] === 'function' ||
            Boolean((ssgConfig as SSGMultiEntryOptions)?.[entryName]);

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
      modifyEntryRuntimePlugins({ entrypoint, plugins }: any) {
        if (ssrConfigMap.get(entrypoint.entryName)) {
          plugins.push({
            name: PLUGIN_IDENTIFIER,
            options: JSON.stringify(ssrConfigMap.get(entrypoint.entryName)),
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
