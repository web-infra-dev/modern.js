import path from 'path';
import {
  getEntryOptions,
  createRuntimeExportsUtils,
  isRouterV5 as isV5,
} from '@modern-js/utils';
import { cloneDeep } from '@modern-js/utils/lodash';
import { ServerRoute } from '@modern-js/types';
import type { CliPlugin, AppTools } from '@modern-js/app-tools';
import { isRouteEntry, modifyEntrypoints } from './entry';
import { isPageComponentFile } from './code/utils';

export { isRouteEntry, modifyEntrypoints } from './entry';

const PLUGIN_IDENTIFIER = 'router';

const ROUTES_IDENTIFIER = 'routes';

export const routerPlugin = (): CliPlugin<AppTools<'shared'>> => ({
  name: '@modern-js/plugin-router',
  required: ['@modern-js/runtime'],
  setup: api => {
    const runtimeConfigMap = new Map<string, any>();

    let pluginsExportsUtils: any;
    let originEntrypoints: any[] = [];

    return {
      checkEntryPoint({ path, entry }) {
        return { path, entry: entry || isRouteEntry(path) };
      },
      config() {
        const appContext = api.useAppContext();

        pluginsExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'plugins',
        );

        return {
          source: {
            include: [
              // react-router v6 is no longer support ie 11
              // so we need to compile these packages to ensure the compatibility
              // https://github.com/remix-run/react-router/commit/f6df0697e1b2064a2b3a12e8b39577326fdd945b
              /node_modules\/react-router/,
              /node_modules\/react-router-dom/,
              /node_modules\/@remix-run\/router/,
            ],
            alias: {
              '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
            },
          },
        };
      },
      async modifyEntrypoints({ entrypoints }) {
        const newEntryPoints = modifyEntrypoints(entrypoints);
        const appContext = api.useAppContext();
        const resolvedConfig = api.useResolvedConfigContext();
        appContext.entrypoints = newEntryPoints;
        originEntrypoints = cloneDeep(newEntryPoints);
        const { generateCode } = await import('./code');
        await generateCode(appContext, resolvedConfig, entrypoints, api);
        return { entrypoints: newEntryPoints };
      },
      modifyEntryImports({ entrypoint, imports }: any) {
        const { entryName, isMainEntry, fileSystemRoutes } = entrypoint;
        const userConfig = api.useResolvedConfigContext();
        const { packageName } = api.useAppContext();

        const runtimeConfig = getEntryOptions(
          entryName,
          isMainEntry,
          userConfig.runtime,
          userConfig.runtimeByEntries,
          packageName,
        );

        runtimeConfigMap.set(entryName, runtimeConfig);
        if (runtimeConfig?.router) {
          if (!isV5(userConfig)) {
            imports.push({
              value: '@modern-js/runtime/plugins',
              specifiers: [{ imported: PLUGIN_IDENTIFIER }],
            });
          }
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
      modifyEntryRuntimePlugins({ entrypoint, plugins }) {
        const { entryName, fileSystemRoutes } = entrypoint;
        const { serverRoutes } = api.useAppContext();
        const userConfig = api.useResolvedConfigContext();
        const runtimeConfig = runtimeConfigMap.get(entryName);
        if (runtimeConfig.router && !isV5(userConfig)) {
          // Todo: plugin-router best to only handle manage client route.
          // here support base server route usage, part for compatibility
          const serverBase = serverRoutes
            .filter((route: ServerRoute) => route.entryName === entryName)
            .map(route => route.urlPath)
            .sort((a, b) => (a.length - b.length > 0 ? -1 : 1));

          plugins.push({
            name: PLUGIN_IDENTIFIER,
            options: JSON.stringify({
              serverBase,
              ...runtimeConfig.router,
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
        const userConfig = api.useResolvedConfigContext();
        if (!isV5(userConfig)) {
          pluginsExportsUtils.addExport(
            `export { default as router } from '@modern-js/runtime/router'`,
          );
        }
      },
      async fileChange(e) {
        const appContext = api.useAppContext();
        const { appDirectory, entrypoints } = appContext;
        const { filename, eventType } = e;
        const nestedRouteEntries = entrypoints
          .map(point => point.nestedRoutesEntry)
          .filter(Boolean) as string[];
        const pagesDir = entrypoints
          .map(point => point.entry)
          // should only watch file-based routes
          .filter(entry => entry && !path.extname(entry))
          .concat(nestedRouteEntries);
        const isPageFile = (name: string) =>
          pagesDir.some(pageDir => name.includes(pageDir));

        const absoluteFilePath = path.resolve(appDirectory, filename);
        const isRouteComponent =
          isPageFile(absoluteFilePath) && isPageComponentFile(absoluteFilePath);

        if (
          isRouteComponent &&
          (eventType === 'add' || eventType === 'unlink')
        ) {
          const resolvedConfig = api.useResolvedConfigContext();
          const { generateCode } = await import('./code');
          const entrypoints = cloneDeep(originEntrypoints);
          await generateCode(appContext, resolvedConfig, entrypoints, api);
        }
      },
    };
  },
});

export default routerPlugin;
