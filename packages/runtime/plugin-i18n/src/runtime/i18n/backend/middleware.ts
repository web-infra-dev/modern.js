import Backend from 'i18next-http-backend';
import type { ExtendedBackendOptions } from '../../../shared/type';
import type { I18nInstance } from '../instance';
import { useI18nextBackendCommon } from './middleware.common';

/**
 * Wrapper for HTTP backend to add a no-op save method
 * This is required for i18next-chained-backend to trigger refresh logic
 * when cacheHitMode is 'refresh' or 'refreshAndUpdateStore'
 */
export class HttpBackendWithSave extends Backend {
  save(_language: string, _namespace: string, _data: unknown): void {
    // No-op: HTTP backend doesn't need to save, but we need this method
    // to trigger i18next-chained-backend's refresh logic
  }
}

export const useI18nextBackend = (
  i18nInstance: I18nInstance,
  backend?: ExtendedBackendOptions,
) => {
  return useI18nextBackendCommon(
    i18nInstance,
    HttpBackendWithSave,
    Backend,
    backend,
  );
};
