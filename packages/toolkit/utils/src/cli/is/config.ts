import type { SSGConfig, SSGMultiEntryOptions } from '@modern-js/types';
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

export const getSSGEntryOptions = (
  entryName: string,
  ssg: SSGConfig | SSGConfig[] | undefined,
  ssgByEntries?: SSGMultiEntryOptions,
): SSGConfig | undefined => {
  if (ssgByEntries && !isEmpty(ssgByEntries)) {
    return ssgByEntries[entryName];
  }
  return Array.isArray(ssg) ? ssg.at(-1) : ssg;
};

export const isSSGEntry = (
  config: any,
  entryName: string,
  _entrypoints?: EntryPoint[],
): boolean => {
  const { ssg, ssgByEntries } = config?.output ?? {};
  return Boolean(getSSGEntryOptions(entryName, ssg, ssgByEntries));
};

export const isSingleEntry = (
  entrypoints: EntryPoint[],
  mainEntryName = MAIN_ENTRY_NAME,
) => entrypoints.length === 1 && entrypoints[0].entryName === mainEntryName;
