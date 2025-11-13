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

  if (hasSdkFunction) {
    const merged = baseMergeBackendOptions(
      {} as BackendOptions,
      backend as BackendOptions,
      userInitOptions?.backend,
    );
    return convertBackendOptions(merged);
  }

  const mergedBackend = backend?.enabled
    ? baseMergeBackendOptions(
        DEFAULT_I18NEXT_BACKEND_OPTIONS,
        backend as BackendOptions,
        userInitOptions?.backend,
      )
    : userInitOptions?.backend;

  return convertBackendOptions(mergedBackend as BackendOptions);
};
