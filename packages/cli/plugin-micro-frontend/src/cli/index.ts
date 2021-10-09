import path from 'path';
import {
  createPlugin,
  useAppContext,
  useResolvedConfigContext,
} from '@modern-js/core';
import {
  createRuntimeExportsUtils,
  getEntryOptions,
  PLUGIN_SCHEMAS,
} from '@modern-js/utils';
import type WebpackChain from 'webpack-chain';
import { makeProvider, makeRenderFunction } from './utils';

const useMicrofrontendConfig = () => {
  const { value: userConfig } = useResolvedConfigContext();

  return userConfig?.deploy?.microFrontend;
};

export default createPlugin(
  (() => {
    const configMap = new Map<string, any>();
    let pluginsExportsUtils: ReturnType<typeof createRuntimeExportsUtils> =
      {} as any;

    return {
      config() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { value: config } = useAppContext();

        pluginsExportsUtils = createRuntimeExportsUtils(
          config.internalDirectory,
          'plugins',
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

              if (mConfig?.enableHtmlEntry) {
                chain.output.libraryTarget('umd');
              }

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
        const { value: config } = useResolvedConfigContext();

        const masterAppConfig = getEntryOptions(
          entrypoint.entryName,
          config?.runtime?.masterApp,
          config.runtimeByEntries,
        );

        pluginsExportsUtils.addExport(
          `export { default as microFrontend } from '${path.resolve(
            __dirname,
            '../../../../',
          )}'`,
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
        const { value: config } = useResolvedConfigContext();

        if (!config?.deploy?.microFrontend) {
          return { entrypoint, code };
        }

        return {
          entrypoint,
          code: makeRenderFunction(
            code,
            Boolean(config?.deploy?.microFrontend?.enableHtmlEntry),
          ),
        };
      },
      modifyEntryExport({ entrypoint, exportStatement }: any) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const mConfig = useMicrofrontendConfig();

        return {
          entrypoint,
          exportStatement: mConfig
            ? makeProvider(mConfig.enableHtmlEntry)
            : exportStatement,
        };
      },
    };
  }) as any,
  {
    name: '@modern-js/plugin-micro-frontend',
  },
) as any;
