import type { BaseBackendOptions } from '../../../shared/type';
import type { I18nInitOptions } from '../instance';
import { mergeBackendOptions as mergeBackendOptionsUtils } from './config';

export const mergeBackendOptions = (
  backend?: BaseBackendOptions,
  userInitOptions?: I18nInitOptions,
) => {
  const mergedBackend = backend?.enabled
    ? mergeBackendOptionsUtils(backend, userInitOptions?.backend)
    : userInitOptions?.backend;
  return mergedBackend;
};
