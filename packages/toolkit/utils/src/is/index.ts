import fs from 'fs';
import path from 'path';
import { createDebugger } from '../debug';
import { isDev } from './node-env';

const debug = createDebugger('judge-depExists');
/**
 * Check if the package name is in dependencies or devDependencies.
 *
 * @param appDirectory - Project root directory.
 * @param name - Package name.
 * @returns True if the name is in dependencies or devDependencies, false otherwise.
 */
export const isDepExists = (appDirectory: string, name: string): boolean => {
  const pkgPath = path.resolve(appDirectory, './package.json');
  if (!fs.existsSync(pkgPath)) {
    debug(`can't find package.json under: %s`, appDirectory);
    return false;
  }
  const json = require(pkgPath);

  const { dependencies = {}, devDependencies = {} } = json;

  return (
    dependencies.hasOwnProperty(name) || devDependencies.hasOwnProperty(name)
  );
};

/**
 * Is typescript project.
 *
 * @param root - App directory.
 * @returns Whether to use typescript.
 */
export const isTypescript = (root: string): boolean =>
  fs.existsSync(path.resolve(root, './tsconfig.json'));

/**
 * Is Empty object
 *
 * @param o - Any object.
 * @returns Whether it is empty object.
 */
export const isEmpty = (o: Record<string, unknown>) =>
  Object.entries(o).length === 0 && o.constructor === Object;

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
  const { output, server } = config;

  if (server?.worker && (output?.ssg || isSSR(config))) {
    return true;
  }

  return false;
};

export const isFastRefresh = () =>
  isDev() && process.env.FAST_REFRESH !== 'false';

export * from './node-env';
export * from './platform';
export * from './type';
