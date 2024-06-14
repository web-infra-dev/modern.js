import { createRuntimeExportsUtils, getEntryOptions } from '@modern-js/utils';
import type { CliHookCallbacks, useConfigContext } from '@modern-js/core';
import type { CliPlugin, AppTools } from '@modern-js/app-tools';
import { logger } from '../util';
import { getRuntimeConfig, setRuntimeConfig } from './utils';
import { generateCode } from './code';

export type UseConfig = ReturnType<typeof useConfigContext>;

export const externals = { 'react-dom': 'react-dom', react: 'react' };

export type LifeCycle = CliHookCallbacks;

type NonInValidAble<T> = T extends null | undefined | false ? never : T;

export function getDefaultMicroFrontedConfig(
  microFrontend: NonInValidAble<
    NonNullable<UseConfig['deploy']>['microFrontend']
  >,
) {
  if (microFrontend === true) {
    return {
      enableHtmlEntry: true,
      externalBasicLibrary: false,
      moduleApp: '',
    };
  }

  return {
    enableHtmlEntry: true,
    externalBasicLibrary: false,
    ...microFrontend,
  };
}

export const garfishPlugin = ({
  pluginName = '@modern-js/plugin-garfish',
} = {}): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-garfish',
  setup: api => {
    let pluginsExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;
    return {
      _internalRuntimePlugins({ entrypoint, plugins }) {
        const userConfig = api.useResolvedConfigContext();
        const { packageName } = api.useAppContext();
        const runtimeConfig = getEntryOptions(
          entrypoint.entryName,
          entrypoint.isMainEntry,
          userConfig.runtime,
          userConfig.runtimeByEntries,
          packageName,
        );
        if (runtimeConfig?.masterApp) {
          plugins.push({
            name: 'garfish',
            implementation: '@modern-js/plugin-garfish',
            config: runtimeConfig?.masterApp || {},
          });
        }
        return { entrypoint, plugins };
      },
      resolvedConfig: async config => {
        const { resolved } = config;
        const { masterApp, router } = getRuntimeConfig(resolved);
        const nConfig = {
          resolved: {
            ...resolved,
          },
        };
        if (masterApp) {
          const useConfig = api.useConfigContext();
          const baseUrl = useConfig?.server?.baseUrl;
          if (Array.isArray(baseUrl)) {
            throw new Error(
              'Now Micro-Front-End mode dose not support multiple baseUrl, you can set it as a string',
            );
          }
          // basename does not exist use router's basename
          setRuntimeConfig(
            nConfig.resolved,
            'masterApp',
            Object.assign(
              typeof masterApp === 'object' ? { ...masterApp } : {},
              {
                basename:
                  baseUrl ||
                  router?.historyOptions?.basename ||
                  router?.basename ||
                  '/',
              },
            ),
          );
        }
        logger(`resolvedConfig`, {
          output: nConfig.resolved.output,
          runtime: nConfig.resolved.runtime,
          deploy: nConfig.resolved.deploy,
          server: nConfig.resolved.server,
        });
        return nConfig;
      },
      config() {
        const useConfig = api.useConfigContext();
        logger('useConfig', useConfig);

        const config = api.useAppContext();
        pluginsExportsUtils = createRuntimeExportsUtils(
          config.internalDirectory,
          'plugins',
        );

        let disableCssExtract = useConfig.output?.disableCssExtract || false;

        // When the micro-frontend application js entry, there is no need to extract css, close cssExtract
        if (useConfig.deploy?.microFrontend) {
          const { enableHtmlEntry } = getDefaultMicroFrontedConfig(
            useConfig.deploy?.microFrontend,
          );
          if (!enableHtmlEntry) {
            disableCssExtract = true;
          }
        }

        return {
          output: {
            disableCssExtract,
          },
          source: {
            alias: {
              '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
              '@modern-js/runtime/garfish': '@modern-js/plugin-garfish/runtime',
            },
          },
          tools: {
            devServer: {
              headers: {
                'Access-Control-Allow-Origin': '*',
              },
            },
            rspack: (config: any) => {
              config.builtins ??= {};

              const resolveOptions = api.useResolvedConfigContext();
              if (
                resolveOptions?.deploy?.microFrontend &&
                !config.externalsType
              ) {
                config.externalsType = 'commonjs';
              }
            },
            bundlerChain: (chain, { env, CHAIN_ID, bundler }) => {
              // add comments avoid sourcemap abnormal
              if (bundler.BannerPlugin) {
                chain
                  .plugin('garfish-banner')
                  .use(bundler.BannerPlugin, [{ banner: 'Micro front-end' }]);
              }

              const resolveOptions = api.useResolvedConfigContext();
              if (resolveOptions?.deploy?.microFrontend) {
                chain.output.libraryTarget('umd');

                const DEFAULT_ASSET_PREFIX = '/';

                // Only override assetPrefix when using the default asset prefix,
                // this allows user or other plugins to set asset prefix.
                const resolvedAssetPrefix = resolveOptions.dev?.assetPrefix;
                const isUsingDefaultAssetPrefix =
                  !useConfig.dev?.assetPrefix &&
                  (!resolvedAssetPrefix ||
                    resolvedAssetPrefix === DEFAULT_ASSET_PREFIX);

                if (
                  isUsingDefaultAssetPrefix &&
                  resolveOptions?.server?.port &&
                  env === 'development'
                ) {
                  chain.output.publicPath(
                    `//localhost:${resolveOptions.server.port}/`,
                  );
                }

                const { enableHtmlEntry, externalBasicLibrary } =
                  getDefaultMicroFrontedConfig(
                    resolveOptions.deploy?.microFrontend,
                  );
                // external
                if (externalBasicLibrary) {
                  chain.externals(externals);
                }
                // use html mode
                if (!enableHtmlEntry) {
                  chain.output.filename('index.js');
                  chain.plugins.delete(`${CHAIN_ID.PLUGIN.HTML}-main`);
                  chain.optimization.runtimeChunk(false);
                  chain.optimization.splitChunks({
                    chunks: 'async',
                  });
                }
              }
              const uniqueName = chain.output.get('uniqueName');
              if (!uniqueName) {
                chain.output.uniqueName(config.packageName);
              }
              const resolveConfig = chain.toConfig();
              logger('bundlerConfig', {
                output: resolveConfig.output,
                externals: resolveConfig.externals,
                env,
                alias: resolveConfig.resolve?.alias,
                plugins: resolveConfig.plugins,
              });
            },
          },
        };
      },
      addRuntimeExports() {
        const config = api.useResolvedConfigContext();
        const { masterApp } = getRuntimeConfig(config);
        if (masterApp) {
          const addExportStatement = `export { default as garfish, default as masterApp } from '${pluginName}/runtime'`;
          logger('exportStatement', addExportStatement);
          pluginsExportsUtils.addExport(addExportStatement);
        }
        const otherExportStatement = `export { hoistNonReactStatics } from '${pluginName}/deps'`;
        logger('otherExportStatement', otherExportStatement);
        pluginsExportsUtils.addExport(otherExportStatement);
      },
      async generateEntryCode({ entrypoints }) {
        const resolveOptions = api.useResolvedConfigContext();
        if (resolveOptions?.deploy?.microFrontend) {
          const appContext = api.useAppContext();
          const resolvedConfig = api.useResolvedConfigContext();
          const { mountId } = resolvedConfig.html;
          await generateCode(appContext, mountId);
        }
        return { entrypoints };
      },
    };
  },
});

export default garfishPlugin;
