import path from 'path';
import { Entrypoint } from '@modern-js/types';
import { PluginAPI } from '@modern-js/core';
import { AppTools } from '@modern-js/app-tools';
import { cloneDeep } from '@modern-js/utils/lodash';
import { modifyEntrypoints } from './entry';
import { isPageComponentFile } from './code/utils';

let originEntrypoints: any[] = [];

export async function handleModifyEntrypoints(
  api: PluginAPI<AppTools<'shared'>>,
  entrypoints: Entrypoint[],
) {
  const config = api.useResolvedConfigContext();
  const newEntryPoints = modifyEntrypoints(entrypoints, config);
  const appContext = api.useAppContext();
  const resolvedConfig = api.useResolvedConfigContext();
  appContext.entrypoints = newEntryPoints;
  originEntrypoints = cloneDeep(newEntryPoints);
  const { generateCode } = await import('./code');
  await generateCode(appContext, resolvedConfig, entrypoints, api);
  return newEntryPoints;
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
