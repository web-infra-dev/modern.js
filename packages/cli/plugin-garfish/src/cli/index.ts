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

  return userConfig || {};
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
          webpack: (_config: any, { chain }: { chain: WebpackChain }) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const userConfig = useMicroFrontEndConfig();
            chain.output.libraryTarget('umd');
            logger('useConfig', {
              server: userConfig?.server,
              runtime: userConfig?.runtime,
              deploy: userConfig?.deploy,
            });

            if (userConfig?.deploy?.microFrontend) {
              chain.externals({ 'react-dom': 'react-dom', react: 'react' });
              logger('externals', chain.toConfig().externals);
            }
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
      const config = useResolvedConfigContext();
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

      const exportStatementCode = makeProvider(componentKey);
      logger('exportStatement', exportStatementCode);
      return {
        entrypoint,
        exportStatement: config?.deploy?.microFrontend
          ? exportStatementCode
          : exportStatement,
      };
    },
  };
};

export default createPlugin(initializer, {
  name: '@modern-js/plugin-garfish',
});
