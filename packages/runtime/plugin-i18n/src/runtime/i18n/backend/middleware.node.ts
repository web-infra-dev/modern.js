import Backend from 'i18next-fs-backend';
import type { BaseBackendOptions } from '../../../shared/type';
import type { I18nInstance } from '../instance';
import { SdkBackend } from './sdk-backend';

export const useI18nextBackend = (
  i18nInstance: I18nInstance,
  backend?: BaseBackendOptions,
) => {
  if (backend?.sdk && typeof backend.sdk === 'function') {
    return i18nInstance.use(SdkBackend);
  }
  return i18nInstance.use(Backend);
};
