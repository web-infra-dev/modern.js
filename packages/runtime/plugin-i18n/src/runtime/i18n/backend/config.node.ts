import path from 'path';
import { deepMerge } from '../../../shared/deepMerge';
import type { BackendOptions } from '../instance';

const appDirectory = process.cwd();

/**
 * Convert HTTP path to filesystem path for SSR
 * For example: '/locales/{{lng}}/{{ns}}.json' -> '/path/to/app/locales/{{lng}}/{{ns}}.json'
 *
 * If the path starts with '/', it's treated as an HTTP path and will be converted
 * to a filesystem path by prepending appDirectory.
 */
const convertPathForSSR = (
  pathStr: string | undefined,
  appDir: string = appDirectory,
): string | undefined => {
  if (!pathStr || typeof pathStr !== 'string') {
    return undefined;
  }

  // If it's a full URL, keep it as is (can't convert to filesystem path)
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
    return pathStr;
  }

  // If path starts with '/', it's an HTTP path - convert to filesystem path
  // by removing the leading '/' and joining with appDirectory
  if (pathStr.startsWith('/')) {
    return path.join(appDir, pathStr.slice(1));
  }

  // If it's already an absolute filesystem path, return as is
  if (path.isAbsolute(pathStr)) {
    return pathStr;
  }

  // Otherwise, treat as relative path and join with appDirectory
  return path.join(appDir, pathStr);
};

export const DEFAULT_I18NEXT_BACKEND_OPTIONS = {
  loadPath: '/locales/{{lng}}/{{ns}}.json',
  addPath: '/locales/{{lng}}/{{ns}}.json',
};

export function mergeBackendOptions(
  userOptions?: BackendOptions,
  defaultOptions?: BackendOptions,
): BackendOptions {
  const defaults = defaultOptions || DEFAULT_I18NEXT_BACKEND_OPTIONS;
  const mergedOptions = deepMerge(defaults, userOptions);

  // In SSR, convert HTTP paths (paths starting with '/') to filesystem paths
  // by automatically prepending appDirectory
  if (mergedOptions && typeof mergedOptions === 'object') {
    const loadPath = (mergedOptions as any).loadPath;
    const addPath = (mergedOptions as any).addPath;

    // Convert loadPath if it exists
    if (loadPath) {
      (mergedOptions as any).loadPath = convertPathForSSR(loadPath);
    }

    // Convert addPath if it exists
    if (addPath) {
      (mergedOptions as any).addPath = convertPathForSSR(addPath);
    }
  }

  return mergedOptions;
}
