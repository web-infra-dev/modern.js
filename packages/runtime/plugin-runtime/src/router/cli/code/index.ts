import path from 'path';
import type {
  AppNormalizedConfig,
  AppTools,
  AppToolsContext,
} from '@modern-js/app-tools';
import type { CLIPluginAPI } from '@modern-js/plugin';
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
  type EagerRouteComponentFilesByEntry,
  collectRouteComponentFiles,
  getEntryOptions,
  isSSGEntry,
  isUseRsc,
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
import { resolveSSRMode } from '../../../cli/ssr/mode';
import { FILE_SYSTEM_ROUTES_FILE_NAME } from '../constants';
import { walk } from './nestedRoutes';
import * as templates from './templates';
import { getServerCombinedModuleFile, getServerLoadersFile } from './utils';

/**
 * Generate routing information for a single entry point (can be reused by the routes inspect feature)
 */
export async function generateRoutesForEntry(
  entrypoint: Entrypoint,
  appContext: AppToolsContext,
): Promise<NestedRouteForCli[]> {
  const routes: NestedRouteForCli[] = [];

  if (entrypoint.nestedRoutesEntry) {
    const nestedRoutes = await walk({
      dirname: entrypoint.nestedRoutesEntry,
      rootDir: entrypoint.nestedRoutesEntry,
      alias: {
        name: appContext.internalSrcAlias,
        basename: appContext.srcDirectory,
      },
      entryName: entrypoint.entryName,
      isMainEntry: entrypoint.isMainEntry,
    });

    if (nestedRoutes) {
      if (!Array.isArray(nestedRoutes)) {
        routes.push(nestedRoutes);
      } else {
        routes.push(...nestedRoutes);
      }
    }
  }

  const fileRoutes: NestedRouteForCli[] =
    routes.length > 0 ? (Array.isArray(routes) ? routes : [routes]) : [];

  const { discoverAndParseConfigRoutes } = await import(
    '../config-routes/parseRouteConfig'
  );

  const configRoutesData = await discoverAndParseConfigRoutes(
    entrypoint,
    appContext,
    fileRoutes,
  );

  if (configRoutesData) {
    const { processConfigRoutes } = await import('../config-routes/converter');

    const processedConfigRoutes = await processConfigRoutes(
      configRoutesData.routes,
      entrypoint.entryName,
      entrypoint.isMainEntry || false,
      path.dirname(configRoutesData.filePath),
      {
        name: appContext.internalSrcAlias,
        basename: appContext.srcDirectory,
      },
    );

    routes.length = 0;
    routes.push(...processedConfigRoutes);
  }

  return routes;
}

export const generateCode = async (
  appContext: AppToolsContext,
  config: AppNormalizedConfig,
  entrypoints: Entrypoint[],
  api: CLIPluginAPI<AppTools>,
) => {
  const { internalDirectory, srcDirectory, internalSrcAlias, packageName } =
    appContext;

  const hooks = api.getHooks();

  // Collect route component files from the FINAL routes (after every
  // `modifyFileSystemRoutes` consumer ran) keyed by entry. A fresh Map per
  // `generateCode` run avoids keeping stale entries when route generation is
  // re-triggered by a dev restart (e.g. an entry was removed). Entries are
  // populated synchronously inside each `generateEntryCode` and published once,
  // after all entries are done, via the public `api.updateAppContext` channel —
  // the app-tools SSR builder plugin reads it back as
  // `BuilderOptions.eagerRouteComponentFilesByEntry` to force route chunks eager
  // under lazy compilation.
  const eagerRouteComponentFilesByEntry: EagerRouteComponentFilesByEntry =
    new Map();

  await Promise.all(entrypoints.map(generateEntryCode));

  api.updateAppContext({ eagerRouteComponentFilesByEntry });

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
      const config = api.getNormalizedConfig();
      const ssr = getEntryOptions(
        entryName,
        isMainEntry,
        config.server.ssr,
        config.server.ssrByEntries,
        packageName,
      );

      const ssrMode = resolveSSRMode({
        entry: entrypoint.entryName,
        config,
        appDirectory: appContext.appDirectory,
        nestedRoutesEntry: entrypoint.nestedRoutesEntry,
      });

      // Check if non-convention-based routing (no nestedRoutesEntry) with non-string SSR mode
      if (
        !nestedRoutesEntry &&
        ssrMode &&
        ssrMode !== 'string' &&
        !isUseRsc(config)
      ) {
        logger.error(
          'Streaming SSR is only supported for convention-based routing (nested routes). Please set `server.ssr.mode` to `"string"` for non-convention-based routing projects.',
        );
        process.exit(1);
      }

      // generate routes file for file system routes entrypoint.
      if (pageRoutesEntry || nestedRoutesEntry) {
        const initialRoutes: (NestedRouteForCli | PageRoute)[] | RouteLegacy[] =
          [];

        const generatedRoutes = await generateRoutesForEntry(
          entrypoint,
          appContext,
        );

        // Remove component fields from generated routes
        const { normalizeRoutes: removeComponentFields } = await import(
          '../config-routes/converter'
        );
        const normalizedRoutes = removeComponentFields(generatedRoutes);

        // Add all routes to initialRoutes
        for (const route of normalizedRoutes) {
          (initialRoutes as Route[]).unshift(route);
        }

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

        // Collect route component files from the FINAL routes (after every
        // `modifyFileSystemRoutes` consumer ran), so the SSR builder plugin can
        // force route component chunks eager under lazy compilation. Collecting
        // here (rather than inside a `modifyFileSystemRoutes` tap) guarantees we
        // capture the routes a later plugin may have replaced/added. The result
        // is published once after all entries via `api.updateAppContext` above.
        const routeEagerFilesForEntry = collectRouteComponentFiles(
          routes,
          srcDirectory,
          internalSrcAlias,
        );
        eagerRouteComponentFilesByEntry.set(entryName, routeEagerFilesForEntry);

        if (ssrMode === 'stream') {
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
            routes: routes,
            ssrMode: isUseRsc(config) ? 'stream' : ssrMode,
            nestedRoutesEntry: entrypoint.nestedRoutesEntry,
            entryName: entrypoint.entryName,
            internalDirectory,
            splitRouteChunks: config?.output?.splitRouteChunks,
            isRscClientBundle: isUseRsc(config),
            srcDirectory,
            internalSrcAlias: appContext.internalSrcAlias,
          }),
        });

        // extract nested router loaders
        if (
          entrypoint.nestedRoutesEntry &&
          (isUseSSRBundle(config) || isUseRsc(config))
        ) {
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
            ssrMode,
            nestedRoutesEntry: entrypoint.nestedRoutesEntry,
            entryName: entrypoint.entryName,
            internalDirectory,
            splitRouteChunks: config?.output?.splitRouteChunks,
            isRscClientBundle: false,
            srcDirectory,
            internalSrcAlias: appContext.internalSrcAlias,
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
          config as AppNormalizedConfig,
          appContext,
        );
        if (serverLoaderCombined) {
          const serverLoaderFile = getServerCombinedModuleFile(
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

export function generatorServerRegisterCode(
  internalDirectory: string,
  entryName: string,
  code: string,
) {
  fs.outputFileSync(
    path.resolve(
      internalDirectory,
      `./${entryName}/${ENTRY_POINT_RUNTIME_GLOBAL_CONTEXT_FILE_NAME}.server.js`,
    ),
    code,
    'utf8',
  );
}
