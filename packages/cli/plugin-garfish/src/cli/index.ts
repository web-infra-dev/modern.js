import path from 'path';
import {
  createRuntimeExportsUtils,
  getEntryOptions,
  PLUGIN_SCHEMAS,
} from '@modern-js/utils';
import {
  createPlugin,
  useAppContext,
  useResolvedConfigContext,
} from '@modern-js/core';
import type WebpackChain from 'webpack-chain';
import { logger } from '../util';
import { makeProvider, makeRenderFunction } from './utils';

const useMicroFrontEndConfig = () => {
  const userConfig = useResolvedConfigContext();
  return userConfig;
};

type GetFirstArgumentOfFunction<T> = T extends (
  first: infer FirstArgument,
  ...args: any[]
) => any
  ? FirstArgument
  : never;

export const initializer: GetFirstArgumentOfFunction<
  typeof createPlugin
> = () => {
  const configMap = new Map<string, any>();
  let pluginsExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;

  let runtimeExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;

  return {
    resolvedConfig(config) {
      const { resolved } = config;
      const { runtime = {} } = resolved;
      const { masterApp, router } = runtime;

      const nConfig = {
        resolved: {
          ...resolved,
        },
      };

      if (masterApp) {
        // basename does not exist use router's basename
        nConfig.resolved.runtime.masterApp = Object.assign(
          typeof masterApp === 'object' ? { ...masterApp } : {},
          {
            basename: router?.basename || '/',
          },
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
            // eslint-disable-next-line @typescript-eslint/no-shadow
            config: any,
            {
              chain,
              webpack,
            }: { chain: WebpackChain; webpack: any; env: string },
          ) => {
            const env = process.env.NODE_ENV;
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const userConfig = useMicroFrontEndConfig();
            const { deploy = {} } = userConfig;

            if (deploy?.microFrontend) {
              chain.output.libraryTarget('umd');

              if (userConfig.server.port) {
                chain.output.publicPath(
                  env === 'development'
                    ? `//localhost:${userConfig.server.port}/`
                    : config.output.publicPath,
                );
              }

              // add comments avoid sourcemap abnormal
              chain
                .plugin('banner')
                .use(webpack.BannerPlugin, [{ banner: 'Micro front-end' }]);

              const { enableHtmlEntry = true, externalBasicLibrary = true } =
                typeof deploy?.microFrontend === 'object'
                  ? deploy.microFrontend
                  : {};
              // external
              if (externalBasicLibrary) {
                chain.externals({ 'react-dom': 'react-dom', react: 'react' });
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

            const webpackConfig = chain.toConfig();
            logger('webpackConfig', {
              output: webpackConfig.output,
              externals: webpackConfig.externals,
              env,
            });
          },
        },
      };
    },
    addRuntimeExports() {
      const mfPackage = path.resolve(__dirname, '../../../../');
      const addExportStatement = `export { default as garfish } from '${mfPackage}'`;
      logger('exportStatement', addExportStatement);
      pluginsExportsUtils.addExport(addExportStatement);

      runtimeExportsUtils.addExport(`export * from '${mfPackage}'`);
    },
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-garfish'];
    },
    modifyEntryImports({ entrypoint, imports }: any) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const config = useMicroFrontEndConfig();
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { packageName } = useAppContext();

      const masterAppConfig = getEntryOptions(
        entrypoint.entryName,
        config?.runtime?.masterApp,
        config.runtimeByEntries,
        packageName,
      );

      configMap.set(entrypoint.entryName, masterAppConfig);

      if (masterAppConfig) {
        imports.push({
          value: '@modern-js/runtime/plugins',
          specifiers: [
            {
              imported: 'garfish',
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
      const masterAppConfig = configMap.get(entrypoint.entryName);

      if (masterAppConfig) {
        logger('garfishPlugin options', masterAppConfig);

        plugins.push({
          name: 'garfish',
          args: 'masterApp',
          options: JSON.stringify(masterAppConfig),
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
      const masterApp = config?.runtime?.masterApp;
      const manifest = masterApp?.manifest || {};
      const { componentKey = 'dynamicComponent' } = manifest;
      if (config?.deploy?.microFrontend) {
        const exportStatementCode = makeProvider(componentKey);
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

export default createPlugin(initializer, {
  name: '@modern-js/plugin-garfish',
});
