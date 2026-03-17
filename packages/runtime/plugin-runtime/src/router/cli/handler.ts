import path from 'path';
import type { AppNormalizedConfig, AppTools } from '@modern-js/app-tools';
import type { CLIPluginAPI } from '@modern-js/plugin';
import type { Entrypoint } from '@modern-js/types';
import { getMeta } from '@modern-js/utils';
import { cloneDeep } from '@modern-js/utils/lodash';
import * as templates from './code/templates';
import { isPageComponentFile } from './code/utils';
import { modifyEntrypoints } from './entry';

type RegenerateRoutesFn = (params: {
  api: CLIPluginAPI<AppTools>;
  appContext: ReturnType<CLIPluginAPI<AppTools>['getAppContext']>;
  resolvedConfig: AppNormalizedConfig;
  entrypoints: Entrypoint[];
}) => Promise<void>;

type HandleFileChangeOptions = {
  includeEntry?: (entrypoint: Entrypoint) => boolean;
  regenerate?: RegenerateRoutesFn;
  entrypointsKey?: string;
};

const DEFAULT_ENTRYPOINTS_KEY = '__default_router_entries__';
const originEntrypointsByKey = new Map<string, Entrypoint[]>();

export async function handleModifyEntrypoints(
  entrypoints: Entrypoint[],
  routesDir?: string,
) {
  return modifyEntrypoints(entrypoints, routesDir);
}

export async function handleGeneratorEntryCode(
  api: CLIPluginAPI<AppTools>,
  entrypoints: Entrypoint[],
  entrypointsKey = DEFAULT_ENTRYPOINTS_KEY,
) {
  const appContext = api.getAppContext();
  const { internalDirectory } = appContext;
  const resolvedConfig = api.getNormalizedConfig();
  const { generatorRegisterCode, generateCode, generatorServerRegisterCode } =
    await import('./code');
  originEntrypointsByKey.set(entrypointsKey, cloneDeep(entrypoints));
  const enableRsc = resolvedConfig?.server?.rsc;
  const routesByEntry = await generateCode(
    appContext,
    resolvedConfig as AppNormalizedConfig,
    entrypoints,
    api,
  );
  await Promise.all(
    entrypoints.map(async entrypoint => {
      if (entrypoint.nestedRoutesEntry || entrypoint.pageRoutesEntry) {
        const route = appContext.serverRoutes.find(
          r => r.entryName === entrypoint.entryName,
        );
        const basename = route?.urlPath || '/';
        generatorRegisterCode(
          internalDirectory,
          entrypoint.entryName,
          await templates.runtimeGlobalContext({
            entryName: entrypoint.entryName,
            metaName: appContext.metaName,
            srcDirectory: appContext.srcDirectory,
            nestedRoutesEntry: entrypoint.nestedRoutesEntry,
            internalSrcAlias: appContext.internalSrcAlias,
            globalApp: entrypoint.fileSystemRoutes?.globalApp,
            rscType: enableRsc ? 'client' : undefined,
            basename,
          }),
        );
        if (enableRsc) {
          generatorServerRegisterCode(
            internalDirectory,
            entrypoint.entryName,
            await templates.runtimeGlobalContext({
              entryName: entrypoint.entryName,
              metaName: appContext.metaName,
              srcDirectory: appContext.srcDirectory,
              nestedRoutesEntry: entrypoint.nestedRoutesEntry,
              internalSrcAlias: appContext.internalSrcAlias,
              globalApp: entrypoint.fileSystemRoutes?.globalApp,
              rscType: 'server',
              basename,
            }),
          );
        }
      }
    }),
  );
  return routesByEntry;
}

export async function handleFileChange(
  api: CLIPluginAPI<AppTools>,
  e: any,
  options: HandleFileChangeOptions = {},
) {
  const { includeEntry, regenerate, entrypointsKey = DEFAULT_ENTRYPOINTS_KEY } =
    options;
  const appContext = api.getAppContext();
  const { appDirectory, entrypoints } = appContext;
  const activeEntrypoints = includeEntry
    ? entrypoints.filter(includeEntry)
    : entrypoints;
  const { filename, eventType } = e;
  const nestedRouteEntries = activeEntrypoints
    .map(point => point.nestedRoutesEntry)
    .filter(Boolean) as string[];
  const pagesDir = activeEntrypoints
    .map(point => point.entry)
    // should only watch file-based routes
    .filter(entry => entry && !path.extname(entry))
    .concat(nestedRouteEntries);

  if (pagesDir.length === 0) {
    return;
  }

  const isPageFile = (name: string) =>
    pagesDir.some(pageDir => name.includes(pageDir));

  const absoluteFilePath = path.resolve(appDirectory, filename);
  const isRouteComponent =
    isPageFile(absoluteFilePath) && isPageComponentFile(absoluteFilePath);

  const meta = getMeta(appContext.metaName);
  // Normalize path for cross-platform (Windows backslashes)
  const normalizedFilename = filename.replace(/\\/g, '/');
  const isConfigRoutesFile =
    normalizedFilename.includes(`${meta}.routes.`) &&
    /\.(js|ts|jsx|tsx|mjs|mts)$/i.test(path.extname(filename));

  if (
    (isRouteComponent && (eventType === 'add' || eventType === 'unlink')) ||
    (isConfigRoutesFile &&
      (eventType === 'change' || eventType === 'add' || eventType === 'unlink'))
  ) {
    const resolvedConfig = api.getNormalizedConfig() as AppNormalizedConfig;
    const cachedEntrypoints =
      originEntrypointsByKey.get(entrypointsKey) || activeEntrypoints;
    const entrypoints = cloneDeep(cachedEntrypoints).filter(entrypoint =>
      includeEntry ? includeEntry(entrypoint) : true,
    );

    if (regenerate) {
      await regenerate({
        api,
        appContext,
        resolvedConfig,
        entrypoints,
      });
      return;
    }

    const { generateCode } = await import('./code');
    await generateCode(appContext, resolvedConfig, entrypoints, api);
  }
}