import type {
  AppNormalizedConfig,
  AppTools,
  AppUserConfig,
  CliPlugin,
} from '@modern-js/app-tools';
import { createCollectAsyncHook } from '@modern-js/plugin';
import { createRuntimeExportsUtils, getEntryOptions } from '@modern-js/utils';
import { logger } from '../util';
import { generateCode } from './code';
import type { AppendEntryCodeFn } from './hooks';
import { getRuntimeConfig, setRuntimeConfig } from './utils';

export const externals = { 'react-dom': 'react-dom', react: 'react' };

type NonInValidAble<T> = T extends null | undefined | false ? never : T;

export function getDefaultMicroFrontedConfig(
  microFrontend: NonInValidAble<
    NonNullable<AppUserConfig['deploy']>['microFrontend']
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

export const garfishPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-garfish',
  pre: ['@modern-js/runtime'],
  registryHooks: {
    appendEntryCode: createCollectAsyncHook<AppendEntryCodeFn>(),
  },
  setup: api => {
    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const userConfig = api.getNormalizedConfig();
      if (userConfig.deploy.microFrontend) {
        return { entrypoint, plugins };
      }
      const { packageName, metaName } = api.getAppContext();
      const runtimeConfig = getEntryOptions(
        entrypoint.entryName,
        entrypoint.isMainEntry!,
        userConfig.runtime,
        userConfig.runtimeByEntries,
        packageName,
      );
      plugins.push({
        name: 'garfish',
        path: `@${metaName}/plugin-garfish/runtime`,
        config: runtimeConfig?.masterApp || {},
      });
      return { entrypoint, plugins };
    });
    api.modifyResolvedConfig(config => {
      const { masterApp, router } = getRuntimeConfig(config);
      if (masterApp) {
        const useConfig = api.getConfig();
        const baseUrl = useConfig?.server?.baseUrl;
        if (Array.isArray(baseUrl)) {
          throw new Error(
            'Now Micro-Front-End mode dose not support multiple baseUrl, you can set it as a string',
          );
        }
        // basename does not exist use router's basename
        setRuntimeConfig(
          config,
          'masterApp',
          Object.assign(typeof masterApp === 'object' ? { ...masterApp } : {}, {
            basename:
              baseUrl ||
              router?.historyOptions?.basename ||
              router?.basename ||
              '/',
          }),
        );
      }
      logger(`resolvedConfig`, {
        output: config.output,
        runtime: config.runtime,
        deploy: config.deploy,
        server: config.server,
      });
      return config;
    });
    api.config(() => {
      const useConfig = api.getConfig();
      const { metaName, packageName } = api.getAppContext();
      logger('useConfig', useConfig);

      let injectStyles = useConfig.output?.injectStyles || false;

      // When the micro-frontend application js entry, there is no need to extract css, close cssExtract
      if (useConfig.deploy?.microFrontend) {
        const { enableHtmlEntry } = getDefaultMicroFrontedConfig(
          useConfig.deploy?.microFrontend,
        );
        if (!enableHtmlEntry) {
          injectStyles = true;
        }
      }

      return {
        output: {
          injectStyles,
        },
        resolve: {
          alias: {
            [`@${metaName}/runtime/garfish`]: `@${metaName}/plugin-garfish/runtime`,
          },
        },
        tools: {
          devServer: {
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          },
          bundlerChain: (chain, { env, CHAIN_ID, bundler }) => {
            // add comments avoid sourcemap abnormal
            if (bundler.BannerPlugin) {
              chain
                .plugin('garfish-banner')
                .use(bundler.BannerPlugin, [{ banner: 'Micro front-end' }]);
            }

            const resolveOptions = api.getNormalizedConfig();
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
              chain.output.uniqueName(packageName);
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
    });
    api.addRuntimeExports(() => {
      const config = api.getNormalizedConfig();
      const { masterApp } = getRuntimeConfig(config);
      const { internalDirectory, metaName } = api.useAppContext();
      const pluginsExportsUtils = createRuntimeExportsUtils(
        internalDirectory,
        'plugins',
      );
      if (masterApp) {
        const addExportStatement = `export { default as garfish, default as masterApp } from '@${metaName}/plugin-garfish/runtime'`;
        logger('exportStatement', addExportStatement);
        pluginsExportsUtils.addExport(addExportStatement);
      }
    });
    api.generateEntryCode(async ({ entrypoints }) => {
      const resolveOptions = api.getNormalizedConfig();
      if (resolveOptions?.deploy?.microFrontend) {
        const appContext = api.getAppContext();
        const resolvedConfig = api.getNormalizedConfig();
        const hooks = api.getHooks();
        await generateCode(
          entrypoints,
          appContext,
          resolvedConfig as AppNormalizedConfig,
          hooks,
        );
      }
    });
  },
});

export default garfishPlugin;
