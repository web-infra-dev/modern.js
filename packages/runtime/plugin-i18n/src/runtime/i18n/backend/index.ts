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

function hasSdkFunction(
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
): boolean {
  return (
    typeof userInitOptions?.backend?.sdk === 'function' ||
    (!!backend?.enabled && !!backend?.sdk && typeof backend.sdk === 'function')
  );
}

/**
 * Checks if loadPath is configured.
 * If backend.enabled is true and user didn't explicitly configure loadPath,
 * we will use default loadPath, so consider it as having loadPath.
 */
function hasLoadPath(
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
): { hasPath: boolean; isExplicit: boolean } {
  const userLoadPath = userInitOptions?.backend?.loadPath ?? backend?.loadPath;
  const isExplicit: boolean = !!userLoadPath && userLoadPath !== '';
  const hasPath =
    isExplicit || (!!backend?.enabled && userLoadPath === undefined);

  return { hasPath, isExplicit };
}

function ensureDefaultLoadPath(
  merged: BackendOptions,
  backend?: BaseBackendOptions,
  isExplicitLoadPath = false,
): void {
  if (backend?.enabled && !isExplicitLoadPath && !merged.loadPath) {
    merged.loadPath = DEFAULT_I18NEXT_BACKEND_OPTIONS.loadPath;
    merged.addPath = DEFAULT_I18NEXT_BACKEND_OPTIONS.addPath;
  }
}

function getFinalLoadPath(
  mergedOptions?: BackendOptions,
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
): string | undefined {
  return (
    mergedOptions?.loadPath ||
    userInitOptions?.backend?.loadPath ||
    (backend?.enabled ? DEFAULT_I18NEXT_BACKEND_OPTIONS.loadPath : undefined)
  );
}

function getFinalSdk(
  mergedOptions?: BackendOptions,
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
): any {
  return (
    mergedOptions?.sdk ||
    userInitOptions?.backend?.sdk ||
    (backend?.sdk && typeof backend.sdk === 'function'
      ? backend.sdk
      : undefined)
  );
}

function buildChainedBackendConfig(
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
): ChainedBackendConfig & BaseBackendOptions {
  const merged = baseMergeBackendOptions(
    DEFAULT_I18NEXT_BACKEND_OPTIONS,
    backend as BackendOptions,
    userInitOptions?.backend,
  );

  const { isExplicit } = hasLoadPath(backend, userInitOptions);
  ensureDefaultLoadPath(merged, backend, isExplicit);

  const mergedOptions = convertBackendOptions(merged);
  const finalLoadPath = getFinalLoadPath(
    mergedOptions,
    backend,
    userInitOptions,
  );
  const finalSdk = getFinalSdk(mergedOptions, backend, userInitOptions);

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

  return {
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
      backendOptions: chainedBackendOptions,
    },
  };
}

function buildSdkOnlyBackendConfig(
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
): BackendOptions {
  const merged = baseMergeBackendOptions(
    {} as BackendOptions,
    backend as BackendOptions,
    userInitOptions?.backend,
  );
  return convertBackendOptions(merged) || ({} as BackendOptions);
}

function buildHttpFsBackendConfig(
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
): BackendOptions {
  const mergedBackend = backend?.enabled
    ? baseMergeBackendOptions(
        DEFAULT_I18NEXT_BACKEND_OPTIONS,
        backend as BackendOptions,
        userInitOptions?.backend,
      )
    : userInitOptions?.backend;

  if (mergedBackend) {
    const { isExplicit } = hasLoadPath(backend, userInitOptions);
    ensureDefaultLoadPath(mergedBackend, backend, isExplicit);
  }

  return (
    convertBackendOptions(mergedBackend as BackendOptions) ||
    ({} as BackendOptions)
  );
}

export const mergeBackendOptions = (
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
) => {
  const sdkFunction = hasSdkFunction(backend, userInitOptions);
  const { hasPath } = hasLoadPath(backend, userInitOptions);

  if (hasPath && sdkFunction) {
    return buildChainedBackendConfig(backend, userInitOptions);
  }

  if (sdkFunction) {
    return buildSdkOnlyBackendConfig(backend, userInitOptions);
  }

  return buildHttpFsBackendConfig(backend, userInitOptions);
};
