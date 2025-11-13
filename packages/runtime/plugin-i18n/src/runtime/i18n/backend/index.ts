import type { BaseBackendOptions } from '../../../shared/type';
import type { BackendOptions, I18nInitOptions } from '../instance';
import { mergeBackendOptions as baseMergeBackendOptions } from './config';
import { DEFAULT_I18NEXT_BACKEND_OPTIONS } from './defaults';

export const mergeBackendOptions = (
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
) => {
  const hasSdkFunction =
    typeof userInitOptions?.backend?.sdk === 'function' ||
    (backend?.enabled && backend?.sdk && typeof backend.sdk === 'function');

  if (hasSdkFunction) {
    return baseMergeBackendOptions(
      {} as BackendOptions,
      backend as BackendOptions,
      userInitOptions?.backend,
    );
  }

  const mergedBackend = backend?.enabled
    ? baseMergeBackendOptions(
        DEFAULT_I18NEXT_BACKEND_OPTIONS,
        backend as BackendOptions,
        userInitOptions?.backend,
      )
    : userInitOptions?.backend;
  return mergedBackend;
};
