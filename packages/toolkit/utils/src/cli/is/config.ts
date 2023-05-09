import type { SSGMultiEntryOptions } from '@modern-js/types';
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
  if (output?.ssg) {
    return true;
  }

  return isSSR(config);
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

export const isRouterV5 = (config: {
  runtime?: { router?: { mode?: string } | boolean };
}) =>
  typeof config.runtime?.router !== 'boolean' &&
  config?.runtime?.router?.mode === 'react-router-5';

export const isSSGEntry = (
  config: any,
  entryName: string,
  entrypoints: EntryPoint[],
) => {
  const ssgConfig = config.output.ssg;
  const useSSG = isSingleEntry(entrypoints)
    ? Boolean(ssgConfig)
    : ssgConfig === true ||
      typeof (ssgConfig as Array<unknown>)?.[0] === 'function' ||
      Boolean((ssgConfig as SSGMultiEntryOptions)?.[entryName]);

  return useSSG;
};

// TODO: remove hard code 'main'
export const isSingleEntry = (entrypoints: EntryPoint[]) =>
  entrypoints.length === 1 && entrypoints[0].entryName === 'main';
