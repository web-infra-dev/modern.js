import { createRuntimeExportsUtils, PLUGIN_SCHEMAS } from '@modern-js/utils';
import type { CliHookCallbacks, useConfigContext } from '@modern-js/core';
import type { CliPlugin, AppTools } from '@modern-js/app-tools';
import { logger } from '../util';
import {
  getRuntimeConfig,
  makeProvider,
  makeRenderFunction,
  setRuntimeConfig,
  generateAsyncEntry,
} from './utils';

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

export default ({
  pluginName = '@modern-js/plugin-garfish',
  runtimePluginName = '@modern-js/runtime/plugins',
} = {}): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-garfish',
  setup: ({ useAppContext, useResolvedConfigContext, useConfigContext }) => {
    let pluginsExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;
    return {
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-garfish'];
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
          // basename does not exist use router's basename
          setRuntimeConfig(
            nConfig.resolved,
            'masterApp',
            Object.assign(
              typeof masterApp === 'object' ? { ...masterApp } : {},
              {
                basename:
                  router?.historyOptions?.basename || router?.basename || '/',
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
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const useConfig = useConfigContext();
        logger('useConfig', useConfig);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useAppContext();
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
            webpackChain: (chain, { webpack, env, CHAIN_ID }) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const resolveOptions = useResolvedConfigContext();
              if (resolveOptions?.deploy?.microFrontend) {
                chain.output.libraryTarget('umd');
                if (
                  !useConfig.dev?.assetPrefix &&
                  resolveOptions?.server?.port &&
                  env === 'development'
                ) {
                  chain.output.publicPath(
                    `//localhost:${resolveOptions.server.port}/`,
                  );
                }

                // add comments avoid sourcemap abnormal
                if (webpack.BannerPlugin) {
                  chain
                    .plugin(CHAIN_ID.PLUGIN.BANNER)
                    .use(webpack.BannerPlugin, [{ banner: 'Micro front-end' }]);
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
              const resolveWebpackConfig = chain.toConfig();
              logger('webpackConfig', {
                output: resolveWebpackConfig.output,
                externals: resolveWebpackConfig.externals,
                env,
                alias: resolveWebpackConfig.resolve?.alias,
                plugins: resolveWebpackConfig.plugins,
              });
            },
          },
        };
      },
      addRuntimeExports() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useResolvedConfigContext();
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
      modifyEntryImports({ entrypoint, imports }) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useResolvedConfigContext();
        const { masterApp } = getRuntimeConfig(config);
        if (masterApp) {
          imports.push({
            value: runtimePluginName,
            specifiers: [
              {
                imported: 'garfish',
              },
            ],
          });
          imports.push({
            value: runtimePluginName,
            specifiers: [
              {
                imported: 'masterApp',
              },
            ],
          });
        }
        imports.push({
          value: runtimePluginName,
          specifiers: [
            {
              imported: 'hoistNonReactStatics',
            },
          ],
        });

        imports.push({
          value: 'react-dom',
          specifiers: [
            {
              imported: 'unmountComponentAtNode',
            },
            {
              imported: 'createPortal',
            },
          ],
        });
        return { imports, entrypoint };
      },
      modifyEntryRuntimePlugins({ entrypoint, plugins }) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useResolvedConfigContext();
        const { masterApp } = getRuntimeConfig(config);
        if (masterApp) {
          logger('garfishPlugin options', masterApp);
          plugins.push({
            name: 'garfish',
            args: 'masterApp',
            options:
              masterApp === true
                ? JSON.stringify({})
                : JSON.stringify(masterApp),
          });
        }
        return { entrypoint, plugins };
      },
      modifyEntryRenderFunction({ entrypoint, code }) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useResolvedConfigContext();
        if (!config?.deploy?.microFrontend) {
          return { entrypoint, code };
        }
        const nCode = makeRenderFunction(code);
        logger('makeRenderFunction', nCode);
        return {
          entrypoint,
          code: nCode,
        };
      },
      modifyAsyncEntry({ entrypoint, code }) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useResolvedConfigContext();
        let finalCode = code;
        if (config?.deploy?.microFrontend && config?.source?.enableAsyncEntry) {
          finalCode = generateAsyncEntry(code);
          return {
            entrypoint,
            code: `${finalCode}`,
          };
        }
        return {
          entrypoint,
          code: finalCode,
        };
      },
      modifyEntryExport({ entrypoint, exportStatement }: any) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useResolvedConfigContext();
        if (config?.deploy?.microFrontend) {
          const exportStatementCode = makeProvider();
          logger('exportStatement', exportStatementCode);
          return {
            entrypoint,
            exportStatement: exportStatementCode,
          };
        }
        return {
          entrypoint,
          exportStatement,
        };
      },
    };
  },
});
