import type { BaseBackendOptions } from '../../../shared/type';
import type { BackendOptions, I18nInitOptions } from '../instance';
import { mergeBackendOptions as baseMergeBackendOptions } from './config';
import { DEFAULT_I18NEXT_BACKEND_OPTIONS } from './defaults';

export const mergeBackendOptions = (
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
) => {
  const mergedBackend = backend?.enabled
    ? baseMergeBackendOptions(
        DEFAULT_I18NEXT_BACKEND_OPTIONS,
        backend as BackendOptions,
        userInitOptions?.backend,
      )
    : userInitOptions?.backend;
  return mergedBackend;
};
