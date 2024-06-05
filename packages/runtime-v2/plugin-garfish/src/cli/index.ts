import type { CliHookCallbacks, useConfigContext } from '@modern-js/core';
import type { CliPlugin, AppTools } from '@modern-js/app-tools-v2';

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

export const garfishPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-garfish',
  setup: ({ useAppContext, useResolvedConfigContext, useConfigContext }) => {
    return {
      resolvedConfig: async config => {
        const { resolved } = config;
        const nConfig = {
          resolved: {
            ...resolved,
          },
        };

        return nConfig;
      },
      config() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const useConfig = useConfigContext();

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useAppContext();

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
          tools: {
            devServer: {
              headers: {
                'Access-Control-Allow-Origin': '*',
              },
            },
            rspack: (config: any) => {
              config.builtins ??= {};

              // eslint-disable-next-line react-hooks/rules-of-hooks
              const resolveOptions = useResolvedConfigContext();
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
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const resolveOptions = useResolvedConfigContext();
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
            },
          },
        };
      },
    };
  },
});

export default garfishPlugin;
