import { isBrowser } from '@modern-js/runtime';
import { deepMerge } from '../../../shared/deepMerge';
import type { BackendOptions } from '../instance';

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

  // In browser, ensure paths are absolute URLs from origin to avoid subpath issues
  // When app is deployed under a subpath (e.g., /en), relative paths get resolved incorrectly
  if (isBrowser() && typeof window !== 'undefined') {
    const origin = window.location.origin;

    // Convert loadPath if it exists and is not already a full URL
    if (
      mergedOptions.loadPath &&
      typeof mergedOptions.loadPath === 'string' &&
      !mergedOptions.loadPath.startsWith('http://') &&
      !mergedOptions.loadPath.startsWith('https://')
    ) {
      // If loadPath starts with '/', prepend origin to make it absolute
      // This ensures it's always resolved from the root, not from current path
      if (mergedOptions.loadPath.startsWith('/')) {
        mergedOptions.loadPath = origin + mergedOptions.loadPath;
      }
    }

    // Convert addPath if it exists and is not already a full URL
    if (
      mergedOptions.addPath &&
      typeof mergedOptions.addPath === 'string' &&
      !mergedOptions.addPath.startsWith('http://') &&
      !mergedOptions.addPath.startsWith('https://')
    ) {
      // If addPath starts with '/', prepend origin to make it absolute
      if (mergedOptions.addPath.startsWith('/')) {
        mergedOptions.addPath = origin + mergedOptions.addPath;
      }
    }
  }

  return mergedOptions;
}
