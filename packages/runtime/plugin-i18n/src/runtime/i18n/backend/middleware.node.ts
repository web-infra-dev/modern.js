import Backend from 'i18next-fs-backend';
import type { ExtendedBackendOptions } from '../../../shared/type';
import type { I18nInstance } from '../instance';
import { useI18nextBackendCommon } from './middleware.common';

/**
 * Wrapper for FS backend to add a no-op save method
 * This is required for i18next-chained-backend to trigger refresh logic
 * when cacheHitMode is 'refresh' or 'refreshAndUpdateStore'
 */
export class FsBackendWithSave extends Backend {
  save(_language: string, _namespace: string, _data: unknown): void {
    // No-op: FS backend doesn't need to save in this context, but we need this method
    // to trigger i18next-chained-backend's refresh logic
  }
}

// Export as HttpBackendWithSave for consistency with browser version
// This allows utils.ts to import the same name in both environments
export const HttpBackendWithSave = FsBackendWithSave;

export const useI18nextBackend = (
  i18nInstance: I18nInstance,
  backend?: ExtendedBackendOptions,
) => {
  return useI18nextBackendCommon(
    i18nInstance,
    FsBackendWithSave,
    Backend,
    backend,
  );
};
