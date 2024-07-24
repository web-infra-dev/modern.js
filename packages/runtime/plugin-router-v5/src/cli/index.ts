import {
  createRuntimeExportsUtils,
  getEntryOptions,
  isRouterV5 as isV5,
} from '@modern-js/utils';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import './types';
import { ServerRoute } from '@modern-js/types';

export const routerPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-router-v5',
  required: ['@modern-js/runtime'],
  setup: api => {
    let routerExportsUtils: any;

    return {
      _internalRuntimePlugins({ entrypoint, plugins }) {
        const userConfig = api.useResolvedConfigContext();
        const { serverRoutes, metaName, packageName } = api.useAppContext();
        if (isV5(userConfig)) {
          const routerConfig = getEntryOptions(
            entrypoint.entryName,
            entrypoint.isMainEntry,
            userConfig.runtime,
            userConfig.runtimeByEntries,
            packageName,
          )?.router;
          const serverBase = serverRoutes
            .filter(
              (route: ServerRoute) => route.entryName === entrypoint.entryName,
            )
            .map(route => route.urlPath)
            .sort((a, b) => (a.length - b.length > 0 ? -1 : 1));
          plugins.push({
            name: 'router',
            path: `@${metaName}/plugin-router-v5/runtime`,
            config:
              typeof routerConfig === 'boolean'
                ? { serverBase }
                : { ...routerConfig, serverBase },
          });
        }
        return { entrypoint, plugins };
      },
      config() {
        const { internalDirectory, metaName } = api.useAppContext();
        // .modern-js/.runtime-exports/router (legacy)
        routerExportsUtils = createRuntimeExportsUtils(
          internalDirectory,
          'router',
        );

        return {
          source: {
            alias: {
              [`@${metaName}/runtime/router-v5`]: routerExportsUtils.getPath(),
              '@meta/runtime': '@modern-js/runtime',
              '@meta/runtime/context': '@modern-js/runtime/context',
            },
          },
        };
      },
      addRuntimeExports() {
        const userConfig = api.useResolvedConfigContext();
        const { internalDirectory, metaName } = api.useAppContext();
        const pluginsExportsUtils = createRuntimeExportsUtils(
          internalDirectory,
          'plugins',
        );
        if (isV5(userConfig)) {
          pluginsExportsUtils.addExport(
            `export { default as router } from '@${metaName}/plugin-router-v5/runtime'`,
          );
          routerExportsUtils?.addExport(
            `export * from '@${metaName}/plugin-router-v5/runtime'`,
          );
        }
      },
    };
  },
});

export default routerPlugin;
