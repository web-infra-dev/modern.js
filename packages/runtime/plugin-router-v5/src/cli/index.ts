import {
  createRuntimeExportsUtils,
  isRouterV5 as isV5,
} from '@modern-js/utils';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import './types';
import { ServerRoute } from '@modern-js/types';

export const routerPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-router-v5',
  required: ['@modern-js/runtime'],
  setup: api => {
    let pluginsExportsUtils: any;
    let routerExportsUtils: any;

    return {
      _internalRuntimePlugins({ entrypoint, plugins }) {
        const userConfig = api.useResolvedConfigContext();
        const { serverRoutes } = api.useAppContext();
        if (isV5(userConfig)) {
          const serverBase = serverRoutes
            .filter(
              (route: ServerRoute) => route.entryName === entrypoint.entryName,
            )
            .map(route => route.urlPath)
            .sort((a, b) => (a.length - b.length > 0 ? -1 : 1));
          plugins.push({
            name: 'router',
            implementation: '@modern-js/plugin-router-v5',
            config: { serverBase },
          });
        }
        return { entrypoint, plugins };
      },
      config() {
        const appContext = api.useAppContext();
        pluginsExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'plugins',
        );

        // .modern-js/.runtime-exports/router (legacy)
        routerExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'router',
        );

        return {
          source: {
            alias: {
              '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
              '@modern-js/runtime/router-v5': routerExportsUtils.getPath(),
            },
          },
        };
      },
      addRuntimeExports() {
        const userConfig = api.useResolvedConfigContext();
        if (isV5(userConfig)) {
          pluginsExportsUtils.addExport(
            `export { default as router } from '@modern-js/plugin-router-v5/runtime'`,
          );
          routerExportsUtils?.addExport(
            `export * from '@modern-js/plugin-router-v5/runtime'`,
          );
        }
      },
    };
  },
});

export default routerPlugin;
