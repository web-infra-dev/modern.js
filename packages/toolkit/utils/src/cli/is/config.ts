import { MAIN_ENTRY_NAME } from '../constants';
import { isEmpty } from './type';

interface EntryPoint {
  entryName: string;
}

/**
 * Is SSR project
 *
 * @param config - User config.
 * @returns Whether to use server side render.
 */
export const isSSR = (config: any): boolean => {
  const { server } = config;

  if (server?.ssr) {
    return true;
  }

  if (server?.ssrByEntries && !isEmpty(server.ssrByEntries)) {
    for (const name of Object.keys(server.ssrByEntries)) {
      if (server.ssrByEntries[name]) {
        return true;
      }
    }
  }

  return false;
};

export const isUseSSRBundle = (config: any): boolean => {
  const { output } = config;
  if (
    output?.ssg ||
    (output?.ssgByEntries && Object.keys(output?.ssgByEntries).length > 0)
  ) {
    return true;
  }

  return isSSR(config);
};

export const isUseRsc = (config: any): boolean => {
  return config?.server?.rsc;
};

/**
 * Is Worker project
 *
 * @param config - User config.
 * @returns Whether to use worker deploy.
 */
export const isServiceWorker = (config: any): boolean => {
  const { output, deploy } = config;

  if (deploy?.worker?.ssr && (output?.ssg || isSSR(config))) {
    return true;
  }

  return false;
};

export const isSSGEntry = (
  config: any,
  entryName: string,
  entrypoints: EntryPoint[],
) => {
  const { output, source } = config;
  const single = isSingleEntry(entrypoints, source?.mainEntryName);

  if (single) {
    const byEntries = output?.ssgByEntries;
    return Boolean(output?.ssg) || (byEntries && !isEmpty(byEntries));
  }

  const byEntries = output?.ssgByEntries;
  if (!byEntries || isEmpty(byEntries)) {
    return false;
  }

  return Boolean(byEntries[entryName]);
};

export const isSingleEntry = (
  entrypoints: EntryPoint[],
  mainEntryName = MAIN_ENTRY_NAME,
) => entrypoints.length === 1 && entrypoints[0].entryName === mainEntryName;
