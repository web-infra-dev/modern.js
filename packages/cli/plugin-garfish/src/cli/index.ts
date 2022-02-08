import path from 'path';
import {
  createRuntimeExportsUtils,
  getEntryOptions,
  PLUGIN_SCHEMAS,
} from '@modern-js/utils';
import {
  createPlugin,
  NormalizedConfig,
  useAppContext,
  useResolvedConfigContext,
} from '@modern-js/core';
import type WebpackChain from 'webpack-chain';
import { logger } from '../util';
import { makeProvider, makeRenderFunction } from './utils';

type GetFirstArgumentOfFunction<T> = T extends (
  first: infer FirstArgument,
  ...args: any[]
) => any
  ? FirstArgument
  : never;

interface InitializerOptions {
  validateSchema: () => Array<any>;
  externals: any;
  componentKey: string;
}

function getRuntimeConfig(config: NormalizedConfig) {
  if (config?.runtime?.feature) {
    return config?.runtime?.feature;
  }
  return config?.runtime;
}

function setRuntimeConfig(config: NormalizedConfig, key: string, value: any) {
  if (config?.runtime && config?.runtime[key]) {
    config.runtime[key] = value;
  }
  if (config?.runtime?.feature && config?.runtime?.feature[key]) {
    config.runtime.feature[key] = value;
  }
}

export const initializer: (
  options: InitializerOptions,
) => GetFirstArgumentOfFunction<typeof createPlugin> =
  ({ validateSchema, externals, componentKey, ...otherLifeCycle }) =>
  () => {
    const configMap = new Map<string, any>();
    let pluginsExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;

    let runtimeExportsUtils: ReturnType<typeof createRuntimeExportsUtils>;

    return {
      resolvedConfig(config) {
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
                basename: router?.basename || '/',
              },
            ),
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
              webpackConfig: any,
              {
                chain,
                webpack,
              }: { chain: WebpackChain; webpack: any; env: string },
            ) => {
              const env = process.env.NODE_ENV;
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const resolvedConfig = useResolvedConfigContext();

              if (resolvedConfig?.deploy?.microFrontend) {
                chain.output.libraryTarget('umd');

                if (resolvedConfig.server.port) {
                  chain.output.publicPath(
                    env === 'development'
                      ? `//localhost:${resolvedConfig.server.port}/`
                      : webpackConfig.output.publicPath,
                  );
                }

                // add comments avoid sourcemap abnormal
                chain
                  .plugin('banner')
                  .use(webpack.BannerPlugin, [{ banner: 'Micro front-end' }]);

                const { enableHtmlEntry = true, externalBasicLibrary = true } =
                  typeof resolvedConfig?.deploy?.microFrontend === 'object'
                    ? resolvedConfig?.deploy?.microFrontend
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
      validateSchema,
      modifyEntryImports({ entrypoint, imports }: any) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const resolvedConfig = useResolvedConfigContext();
        // support legacy config
        const { masterApp } = getRuntimeConfig(resolvedConfig);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { packageName } = useAppContext();

        const masterAppConfig = getEntryOptions(
          entrypoint.entryName,
          masterApp,
          resolvedConfig.runtimeByEntries,
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
        const resolvedConfig = useResolvedConfigContext();
        if (resolvedConfig?.deploy?.microFrontend) {
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
      ...otherLifeCycle,
    };
  };

export default createPlugin(
  initializer({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-garfish'];
    },
    externals: { 'react-dom': 'react-dom', react: 'react' },
    componentKey: 'dynamicComponent',
  }),
  {
    name: '@modern-js/plugin-garfish',
  },
);
