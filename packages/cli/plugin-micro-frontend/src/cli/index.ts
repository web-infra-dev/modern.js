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
import { makeProvider, makeRenderFunction } from './utils';

const useMicrofrontendConfig = () => {
  const userConfig = useResolvedConfigContext();

  return userConfig?.deploy?.microFrontend;
};

export default createPlugin(
  (() => {
    const configMap = new Map<string, any>();
    let pluginsExportsUtils: ReturnType<typeof createRuntimeExportsUtils> =
      {} as any;

    let runtimeExportsUtils: ReturnType<typeof createRuntimeExportsUtils> =
      {} as any;

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
              const mConfig = useMicrofrontendConfig();
              chain.output.libraryTarget('umd');

              if (mConfig) {
                chain.externals({ 'react-dom': 'react-dom', react: 'react' });
              }
            },
          },
        };
      },
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-micro-frontend'];
      },
      modifyEntryImports({ entrypoint, imports }: any) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useResolvedConfigContext();

        const masterAppConfig = getEntryOptions(
          entrypoint.entryName,
          config?.runtime?.masterApp,
          config.runtimeByEntries,
        );

        configMap.set(entrypoint.entryName, masterAppConfig);

        if (masterAppConfig) {
          imports.push({
            value: '@modern-js/runtime/plugins',
            specifiers: [
              {
                imported: 'microFrontend',
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
          plugins.push({
            name: 'microFrontend',
            options: JSON.stringify(masterAppConfig),
          });
        }
      },
      modifyEntryRenderFunction({ entrypoint, code }: any) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useResolvedConfigContext();

        if (!config?.deploy?.microFrontend) {
          return { entrypoint, code };
        }

        return {
          entrypoint,
          code: makeRenderFunction(code),
        };
      },
      modifyEntryExport({ entrypoint, exportStatement }: any) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const mConfig = useMicrofrontendConfig();

        return {
          entrypoint,
          exportStatement: mConfig ? makeProvider() : exportStatement,
        };
      },
      addRuntimeExports() {
        const mfPackage = path.resolve(__dirname, '../../../../');
        pluginsExportsUtils.addExport(
          `export { default as microFrontend } from '${mfPackage}'`,
        );

        runtimeExportsUtils.addExport(`export * from '${mfPackage}'`);
      },
    };
  }) as any,
  {
    name: '@modern-js/plugin-micro-frontend',
  },
) as any;
