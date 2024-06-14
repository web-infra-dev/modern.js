import path from 'path';
import { Entrypoint } from '@modern-js/types';
import { PluginAPI } from '@modern-js/core';
import { AppTools } from '@modern-js/app-tools';
import { cloneDeep } from '@modern-js/utils/lodash';
import { modifyEntrypoints } from './entry';
import { isPageComponentFile } from './code/utils';
import * as templates from './code/templates';

let originEntrypoints: any[] = [];

export async function handleModifyEntrypoints(
  api: PluginAPI<AppTools<'shared'>>,
  entrypoints: Entrypoint[],
) {
  const config = api.useResolvedConfigContext();
  return modifyEntrypoints(entrypoints, config);
}

export async function handleGeneratorEntryCode(
  api: PluginAPI<AppTools<'shared'>>,
  entrypoints: Entrypoint[],
) {
  const appContext = api.useAppContext();
  const { internalDirectory } = api.useAppContext();
  const resolvedConfig = api.useResolvedConfigContext();
  const { generatorRegisterCode, generateCode } = await import('./code');
  originEntrypoints = cloneDeep(entrypoints);
  await generateCode(appContext, resolvedConfig, entrypoints, api);
  await Promise.all(
    entrypoints.map(async entrypoint => {
      if (entrypoint.nestedRoutesEntry) {
        generatorRegisterCode(
          internalDirectory,
          entrypoint.entryName,
          templates.runtimeGlobalContext({
            metaName: appContext.metaName,
          }),
        );
      }
    }),
  );
  return entrypoints;
}

export async function handleFileChange(
  api: PluginAPI<AppTools<'shared'>>,
  e: any,
) {
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

  if (isRouteComponent && (eventType === 'add' || eventType === 'unlink')) {
    const resolvedConfig = api.useResolvedConfigContext();
    const { generateCode } = await import('./code');
    const entrypoints = cloneDeep(originEntrypoints);
    await generateCode(appContext, resolvedConfig, entrypoints, api);
  }
}
