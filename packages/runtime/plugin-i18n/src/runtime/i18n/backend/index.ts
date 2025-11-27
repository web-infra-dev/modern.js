import type { BaseBackendOptions } from '../../../shared/type';
import type { BackendOptions, I18nInitOptions } from '../instance';
import { mergeBackendOptions as baseMergeBackendOptions } from './config';
import {
  DEFAULT_I18NEXT_BACKEND_OPTIONS,
  convertBackendOptions,
} from './defaults';

export const mergeBackendOptions = (
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
) => {
  const hasSdkFunction =
    typeof userInitOptions?.backend?.sdk === 'function' ||
    (backend?.enabled && backend?.sdk && typeof backend.sdk === 'function');
  const hasLoadPath = !!(
    userInitOptions?.backend?.loadPath || backend?.loadPath
  );

  // If both loadPath and sdk are provided, return chained backend config
  if (hasLoadPath && hasSdkFunction) {
    const merged = baseMergeBackendOptions(
      DEFAULT_I18NEXT_BACKEND_OPTIONS,
      backend as BackendOptions,
      userInitOptions?.backend,
    );
    const mergedOptions = convertBackendOptions(merged);

    // Return chained backend configuration
    // The actual backend classes will be set in middleware based on environment
    // cacheHitMode defaults to 'refreshAndUpdateStore' to allow FS/HTTP resources
    // to display first, then SDK resources will update them asynchronously
    return {
      ...mergedOptions,
      cacheHitMode:
        mergedOptions?.cacheHitMode ||
        (backend as BackendOptions)?.cacheHitMode ||
        userInitOptions?.backend?.cacheHitMode ||
        'refreshAndUpdateStore',
      _useChainedBackend: true,
      _chainedBackendConfig: {
        // These will be populated in middleware
        backendOptions: [
          {
            loadPath: mergedOptions?.loadPath,
            addPath: mergedOptions?.addPath,
          },
          {
            sdk: mergedOptions?.sdk,
          },
        ],
      },
    } as any;
  }

  // If only SDK is provided, use SDK backend
  if (hasSdkFunction) {
    const merged = baseMergeBackendOptions(
      {} as BackendOptions,
      backend as BackendOptions,
      userInitOptions?.backend,
    );
    return convertBackendOptions(merged);
  }

  // Otherwise, use HTTP/FS backend
  const mergedBackend = backend?.enabled
    ? baseMergeBackendOptions(
        DEFAULT_I18NEXT_BACKEND_OPTIONS,
        backend as BackendOptions,
        userInitOptions?.backend,
      )
    : userInitOptions?.backend;

  return convertBackendOptions(mergedBackend as BackendOptions);
};
