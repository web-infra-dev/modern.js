import path from 'path';
import {
  getEntryOptions,
  createRuntimeExportsUtils,
  PLUGIN_SCHEMAS,
} from '@modern-js/utils';
import {
  useAppContext,
  createPlugin,
  useResolvedConfigContext,
} from '@modern-js/core';

const PLUGIN_IDENTIFIER = 'router';

const ROUTES_IDENTIFIER = 'routes';

export default createPlugin(
  (() => {
    const runtimeConfigMap = new Map<string, any>();

    let pluginsExportsUtils: any;
    const runtimeModulePath = path.resolve(__dirname, '../../../../');

    return {
      config() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const appContext = useAppContext();

        pluginsExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'plugins',
        );

        return {
          source: {
            alias: {
              '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
            },
          },
        };
      },
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-router'];
      },
      modifyEntryImports({ entrypoint, imports }: any) {
        const { entryName, fileSystemRoutes } = entrypoint;
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const userConfig = useResolvedConfigContext();

        const runtimeConfig = getEntryOptions(
          entryName,
          (userConfig as any).runtime,
          (userConfig as any).runtimeByEntries,
        );

        runtimeConfigMap.set(entryName, runtimeConfig);

        if (runtimeConfig.router) {
          imports.push({
            value: '@modern-js/runtime/plugins',
            specifiers: [{ imported: PLUGIN_IDENTIFIER }],
          });
        } else if (fileSystemRoutes) {
          throw new Error(
            `should enable runtime.router for entry ${entryName}`,
          );
        }

        return {
          entrypoint,
          imports,
        };
      },
      modifyEntryRuntimePlugins({ entrypoint, plugins }: any) {
        const { entryName, fileSystemRoutes } = entrypoint;
        const {
          serverRoutes,
          // eslint-disable-next-line react-hooks/rules-of-hooks
        } = useAppContext();

        const runtimeConfig = runtimeConfigMap.get(entryName);
        if (runtimeConfig.router) {
          plugins.push({
            name: PLUGIN_IDENTIFIER,
            options: JSON.stringify({
              ...runtimeConfig.router,
              historyOptions: {
                basename: serverRoutes.find(
                  (route: any) => route.entryName === entryName,
                )?.urlPath,
              },
              routesConfig: fileSystemRoutes
                ? `{ ${ROUTES_IDENTIFIER}, globalApp: App }`
                : undefined,
            }).replace(
              /"routesConfig"\s*:\s*"((\S|\s)+)"/g,
              '"routesConfig": $1,',
            ),
          });
        }
        return {
          entrypoint,
          plugins,
        };
      },
      addRuntimeExports() {
        pluginsExportsUtils.addExport(
          `export { default as router } from '${runtimeModulePath}'`,
        );
      },
    };
  }) as any,
  {
    name: '@modern-js/plugin-router',
    required: ['@modern-js/runtime'],
  },
);
