import type {
  BaseBackendOptions,
  ChainedBackendConfig,
} from '../../../shared/type';
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
  // Check if user explicitly configured loadPath (non-empty string)
  // If backend.enabled is true and user didn't explicitly configure loadPath,
  // we will use default loadPath, so consider it as having loadPath
  const userLoadPath = userInitOptions?.backend?.loadPath ?? backend?.loadPath;
  const hasExplicitLoadPath = !!userLoadPath && userLoadPath !== '';
  const hasLoadPath =
    hasExplicitLoadPath || (backend?.enabled && userLoadPath === undefined);

  // If both loadPath and sdk are provided, return chained backend config
  if (hasLoadPath && hasSdkFunction) {
    const merged = baseMergeBackendOptions(
      DEFAULT_I18NEXT_BACKEND_OPTIONS,
      backend as BackendOptions,
      userInitOptions?.backend,
    );
    // If user didn't explicitly configure loadPath but backend.enabled is true,
    // ensure default loadPath is used
    if (backend?.enabled && !hasExplicitLoadPath && !merged.loadPath) {
      merged.loadPath = DEFAULT_I18NEXT_BACKEND_OPTIONS.loadPath;
      merged.addPath = DEFAULT_I18NEXT_BACKEND_OPTIONS.addPath;
    }
    const mergedOptions = convertBackendOptions(merged);

    // Ensure loadPath and sdk are properly set
    const finalLoadPath =
      mergedOptions?.loadPath ||
      userInitOptions?.backend?.loadPath ||
      (backend?.enabled ? DEFAULT_I18NEXT_BACKEND_OPTIONS.loadPath : undefined);
    const finalSdk =
      mergedOptions?.sdk ||
      userInitOptions?.backend?.sdk ||
      (backend?.sdk && typeof backend.sdk === 'function'
        ? backend.sdk
        : undefined);

    // Return chained backend configuration
    // The actual backend classes will be set in middleware based on environment
    // cacheHitMode defaults to 'refreshAndUpdateStore' to allow FS/HTTP resources
    // to display first, then SDK resources will update them asynchronously
    const chainedBackendOptions = [
      {
        loadPath: finalLoadPath,
        addPath:
          mergedOptions?.addPath || DEFAULT_I18NEXT_BACKEND_OPTIONS.addPath,
      },
      {
        sdk: finalSdk,
      },
    ];

    const result: ChainedBackendConfig & BaseBackendOptions = {
      ...mergedOptions,
      loadPath: finalLoadPath,
      sdk: finalSdk,
      cacheHitMode:
        mergedOptions?.cacheHitMode ||
        (backend as BackendOptions)?.cacheHitMode ||
        userInitOptions?.backend?.cacheHitMode ||
        'refreshAndUpdateStore',
      _useChainedBackend: true,
      _chainedBackendConfig: {
        // These will be populated in middleware
        backendOptions: chainedBackendOptions,
      },
    };

    return result;
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

  // If user didn't explicitly configure loadPath but backend.enabled is true,
  // ensure default loadPath is used
  if (
    mergedBackend &&
    backend?.enabled &&
    !hasExplicitLoadPath &&
    !mergedBackend.loadPath
  ) {
    mergedBackend.loadPath = DEFAULT_I18NEXT_BACKEND_OPTIONS.loadPath;
    mergedBackend.addPath = DEFAULT_I18NEXT_BACKEND_OPTIONS.addPath;
  }

  return convertBackendOptions(mergedBackend as BackendOptions);
};
