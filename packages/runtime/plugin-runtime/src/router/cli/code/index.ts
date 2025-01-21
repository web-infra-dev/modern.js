import path from 'path';
import type {
  AppNormalizedConfig,
  AppTools,
  AppToolsContext,
} from '@modern-js/app-tools';
import type { CLIPluginAPI } from '@modern-js/plugin-v2';
import type {
  Entrypoint,
  NestedRouteForCli,
  PageRoute,
  Route,
  RouteLegacy,
  SSRMode,
} from '@modern-js/types';
import {
  fs,
  getEntryOptions,
  isRouterV5,
  isSSGEntry,
  isUseSSRBundle,
  logger,
} from '@modern-js/utils';
import {
  filterRoutesForServer,
  filterRoutesLoader,
  markRoutes,
} from '@modern-js/utils';
import { cloneDeep } from '@modern-js/utils/lodash';
import { ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME } from '../../../cli/constants';
import { FILE_SYSTEM_ROUTES_FILE_NAME } from '../constants';
import { getClientRoutes, getClientRoutesLegacy } from './getClientRoutes';
import { walk } from './nestedRoutes';
import * as templates from './templates';
import { getServerCombinedModueFile, getServerLoadersFile } from './utils';

export const generateCode = async (
  appContext: AppToolsContext<'shared'>,
  config: AppNormalizedConfig<'shared'>,
  entrypoints: Entrypoint[],
  api: CLIPluginAPI<AppTools<'shared'>>,
) => {
  const {
    internalDirectory,
    srcDirectory,
    internalDirAlias,
    internalSrcAlias,
    packageName,
  } = appContext;

  const hooks = api.getHooks();

  const isV5 = isRouterV5(config);
  const getRoutes = isV5 ? getClientRoutesLegacy : getClientRoutes;
  const oldVersion =
    typeof (config?.runtime.router as { oldVersion: boolean }) === 'object'
      ? Boolean((config?.runtime.router as { oldVersion: boolean }).oldVersion)
      : false;

  await Promise.all(entrypoints.map(generateEntryCode));

  async function generateEntryCode(entrypoint: Entrypoint) {
    const {
      entryName,
      isMainEntry,
      isAutoMount,
      pageRoutesEntry,
      nestedRoutesEntry,
    } = entrypoint;
    const { metaName } = api.getAppContext();
    if (isAutoMount) {
      // generate routes file for file system routes entrypoint.
      if (pageRoutesEntry || nestedRoutesEntry) {
        let initialRoutes: (NestedRouteForCli | PageRoute)[] | RouteLegacy[] =
          [];
        let nestedRoutes: NestedRouteForCli | NestedRouteForCli[] | null = null;
        if (entrypoint.entry) {
          initialRoutes = getRoutes({
            entrypoint,
            srcDirectory,
            srcAlias: internalSrcAlias,
            internalDirectory,
            internalDirAlias,
          });
        }
        if (!isV5 && entrypoint.nestedRoutesEntry) {
          nestedRoutes = await walk(
            entrypoint.nestedRoutesEntry,
            entrypoint.nestedRoutesEntry,
            {
              name: internalSrcAlias,
              basename: srcDirectory,
            },
            entrypoint.entryName,
            entrypoint.isMainEntry,
            oldVersion,
          );
          if (nestedRoutes) {
            if (!Array.isArray(nestedRoutes)) {
              nestedRoutes = [nestedRoutes];
            }
            for (const route of nestedRoutes) {
              (initialRoutes as Route[]).unshift(route);
            }
          }
        }

        const config = api.getNormalizedConfig();
        const ssrByRouteIds = config.server.ssrByRouteIds || [];
        const clonedRoutes = cloneDeep(initialRoutes);

        const markedRoutes =
          ssrByRouteIds.length > 0
            ? markRoutes(
                clonedRoutes as (NestedRouteForCli | PageRoute)[],
                ssrByRouteIds,
              )
            : initialRoutes;

        const { routes } = await hooks.modifyFileSystemRoutes.call({
          entrypoint,
          routes: markedRoutes,
        });

        const ssr = getEntryOptions(
          entryName,
          isMainEntry,
          config.server.ssr,
          config.server.ssrByEntries,
          packageName,
        );
        const useSSG = isSSGEntry(config, entryName, entrypoints);

        let mode: SSRMode | undefined;
        if (ssr) {
          mode = typeof ssr === 'object' ? ssr.mode || 'string' : 'string';
        }
        if (mode === 'stream') {
          const hasPageRoute = routes.some(
            route => 'type' in route && route.type === 'page',
          );
          if (hasPageRoute) {
            logger.error(
              'Streaming ssr is not supported when pages dir exists',
            );
            process.exit(1);
          }
        }

        const { code } = await hooks.onBeforeGenerateRoutes.call({
          entrypoint,
          code: await templates.fileSystemRoutes({
            metaName,
            routes,
            ssrMode: useSSG ? 'string' : mode,
            nestedRoutesEntry: entrypoint.nestedRoutesEntry,
            entryName: entrypoint.entryName,
            internalDirectory,
            splitRouteChunks: config?.output?.splitRouteChunks,
          }),
        });

        // extract nested router loaders
        if (entrypoint.nestedRoutesEntry && isUseSSRBundle(config)) {
          const routesServerFile = getServerLoadersFile(
            internalDirectory,
            entryName,
          );

          const filtedRoutesForServer = filterRoutesForServer(
            routes as (NestedRouteForCli | PageRoute)[],
          );
          const routesForServerLoaderMatches = filterRoutesLoader(
            routes as (NestedRouteForCli | PageRoute)[],
          );

          const code = templates.routesForServer({
            routesForServerLoaderMatches,
          });

          await fs.ensureFile(routesServerFile);
          await fs.writeFile(routesServerFile, code);

          const serverRoutesCode = await templates.fileSystemRoutes({
            metaName,
            routes: filtedRoutesForServer,
            ssrMode: useSSG ? 'string' : mode,
            nestedRoutesEntry: entrypoint.nestedRoutesEntry,
            entryName: entrypoint.entryName,
            internalDirectory,
            splitRouteChunks: config?.output?.splitRouteChunks,
          });

          await fs.outputFile(
            path.resolve(internalDirectory, `./${entryName}/routes.server.js`),
            serverRoutesCode,
            'utf8',
          );
        }

        const serverLoaderCombined = templates.ssrLoaderCombinedModule(
          entrypoints,
          entrypoint,
          config as AppNormalizedConfig<'shared'>,
          appContext,
        );
        if (serverLoaderCombined) {
          const serverLoaderFile = getServerCombinedModueFile(
            internalDirectory,
            entryName,
          );

          await fs.outputFile(serverLoaderFile, serverLoaderCombined);
        }

        await fs.outputFile(
          path.resolve(
            internalDirectory,
            `./${entryName}/${FILE_SYSTEM_ROUTES_FILE_NAME}`,
          ),
          code,
          'utf8',
        );
      }
    }
  }
};

export function generatorRegisterCode(
  internalDirectory: string,
  entryName: string,
  code: string,
) {
  fs.outputFileSync(
    path.resolve(
      internalDirectory,
      `./${entryName}/${ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME}.js`,
    ),
    code,
    'utf8',
  );
}
