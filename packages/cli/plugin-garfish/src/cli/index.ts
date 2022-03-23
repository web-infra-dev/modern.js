import path from 'path';
import { createRuntimeExportsUtils, PLUGIN_SCHEMAS } from '@modern-js/utils';
import type { CliHookCallbacks, CliPlugin } from '@modern-js/core';
import type WebpackChain from 'webpack-chain';
import { logger } from '../util';
import {
  getRuntimeConfig,
  makeProvider,
  makeRenderFunction,
  setRuntimeConfig,
} from './utils';

export const externals = { 'react-dom': 'react-dom', react: 'react' };

type Initializer = CliPlugin['setup'];
export type LifeCycle = CliHookCallbacks;

export const initializer: Initializer = ({
  useAppContext,
  useResolvedConfigContext,
}) => {
  let pluginsExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;
  let runtimeExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;
  const runtimePluginName =
    process.env.PLUGIN_RUNTIME_PATH || '@modern-js/runtime/plugins';

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
          Object.assign(typeof masterApp === 'object' ? { ...masterApp } : {}, {
            basename:
              router?.historyOptions?.basename || router?.basename || '/',
          }),
        );
      }

      logger(`resolvedConfig`, {
        runtime: nConfig.resolved.runtime,
        deploy: nConfig.resolved.deploy,
        server: nConfig.resolved.server,
      });
      return nConfig;
    },
    config() {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const config = useAppContext();
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const resolveOptions = useResolvedConfigContext();

      pluginsExportsUtils = createRuntimeExportsUtils(
        config.internalDirectory,
        'plugins',
      );

      runtimeExportsUtils = createRuntimeExportsUtils(
        config.internalDirectory,
        'index',
      );

      return {
        source: {
          alias: {
            '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
          },
        },
        tools: {
          webpack: (
            webpackConfig: any,
            {
              chain,
              webpack,
              env = process.env.NODE_ENV || 'development',
            }: { chain: WebpackChain; webpack: any; env: string },
          ) => {
            if (resolveOptions?.deploy?.microFrontend) {
              chain.output.libraryTarget('umd');
              chain.devServer.headers({
                'Access-Control-Allow-Origin': '*',
              });
              if (resolveOptions?.server?.port) {
                chain.output.publicPath(
                  env === 'development'
                    ? `//localhost:${resolveOptions.server.port}/`
                    : webpackConfig.output.publicPath,
                );
              }
              // add comments avoid sourcemap abnormal
              if (webpack.BannerPlugin) {
                chain
                  .plugin('banner')
                  .use(webpack.BannerPlugin, [{ banner: 'Micro front-end' }]);
              }
              const { enableHtmlEntry = true, externalBasicLibrary = false } =
                typeof resolveOptions?.deploy?.microFrontend === 'object'
                  ? resolveOptions?.deploy?.microFrontend
                  : {};
              // external
              if (externalBasicLibrary) {
                chain.externals(externals);
              }
              // use html mode
              if (!enableHtmlEntry) {
                chain.output.filename('index.js');
                chain.plugins.delete('html-main');
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
            });
          },
        },
      };
    },
    addRuntimeExports() {
      const mfPackage = path.resolve(__dirname, '../../../../');
      const addExportStatement = `export { default as garfish, default as masterApp } from '${mfPackage}'`;
      logger('exportStatement', addExportStatement);
      pluginsExportsUtils.addExport(addExportStatement);

      runtimeExportsUtils.addExport(`export * from '${mfPackage}'`);
    },
    modifyEntryImports({ entrypoint, imports }: any) {
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
    modifyEntryRuntimePlugins({ entrypoint, plugins }: any) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const config = useResolvedConfigContext();
      const { masterApp } = getRuntimeConfig(config);

      if (masterApp) {
        logger('garfishPlugin options', masterApp);

        plugins.push({
          name: 'garfish',
          args: 'masterApp',
          options:
            masterApp === true ? JSON.stringify({}) : JSON.stringify(masterApp),
        });
      }
      return { entrypoint, plugins };
    },
    modifyEntryRenderFunction({ entrypoint, code }: any) {
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
};

export default (): CliPlugin => ({
  name: '@modern-js/plugin-garfish',
  setup: initializer,
});
