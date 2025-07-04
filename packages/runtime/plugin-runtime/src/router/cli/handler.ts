import path from 'path';
import type { AppNormalizedConfig, AppTools } from '@modern-js/app-tools';
import type { CLIPluginAPI } from '@modern-js/plugin-v2';
import type { Entrypoint } from '@modern-js/types';
import { cloneDeep } from '@modern-js/utils/lodash';
import * as templates from './code/templates';
import { isPageComponentFile } from './code/utils';
import { modifyEntrypoints } from './entry';

let originEntrypoints: any[] = [];

export async function handleModifyEntrypoints(
  isRouterV5: boolean,
  entrypoints: Entrypoint[],
) {
  return modifyEntrypoints(entrypoints, isRouterV5);
}

export async function handleGeneratorEntryCode(
  api: CLIPluginAPI<AppTools<'shared'>>,
  entrypoints: Entrypoint[],
  isRouterV5: boolean,
) {
  const appContext = api.getAppContext();
  const { internalDirectory } = appContext;
  const resolvedConfig = api.getNormalizedConfig();
  const { generatorRegisterCode, generateCode, generatorServerRegisterCode } =
    await import('./code');
  originEntrypoints = cloneDeep(entrypoints);
  const enableRsc = resolvedConfig?.server?.rsc;
  await generateCode(
    appContext,
    resolvedConfig as AppNormalizedConfig<'shared'>,
    entrypoints,
    api,
    isRouterV5,
  );
  await Promise.all(
    entrypoints.map(async entrypoint => {
      if (entrypoint.nestedRoutesEntry || entrypoint.pageRoutesEntry) {
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
            }),
          );
        }
      }
    }),
  );
  return entrypoints;
}

export async function handleFileChange(
  api: CLIPluginAPI<AppTools<'shared'>>,
  isRouterV5: boolean,
  e: any,
) {
  const appContext = api.getAppContext();
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

  if (isRouteComponent && (eventType === 'add' || eventType === 'unlink')) {
    const resolvedConfig = api.getNormalizedConfig();
    const { generateCode } = await import('./code');
    const entrypoints = cloneDeep(originEntrypoints);
    await generateCode(
      appContext,
      resolvedConfig as AppNormalizedConfig<'shared'>,
      entrypoints,
      api,
      isRouterV5,
    );
  }
}
