import ChainedBackend from 'i18next-chained-backend';
import type {
  BaseBackendOptions,
  ChainedBackendConfig,
} from '../../../shared/type';
import type { I18nInstance } from '../instance';
import { SdkBackend } from './sdk-backend';

/**
 * Backend configuration that may include chained backend config
 */
type BackendConfigWithChained = BaseBackendOptions &
  Partial<ChainedBackendConfig>;

/**
 * Common logic for using i18next backend
 * This function handles the backend selection and chained backend configuration
 *
 * @param i18nInstance - The i18n instance to configure
 * @param BackendWithSave - The wrapped backend class with save method (required for chained backend refresh logic)
 * @param BackendBase - The base backend class (for non-chained use)
 * @param backend - Optional backend configuration
 */
export function useI18nextBackendCommon(
  i18nInstance: I18nInstance,
  BackendWithSave: new (...args: any[]) => any, // The wrapped backend class with save method
  BackendBase: new (...args: any[]) => any, // The base backend class (for non-chained use)
  backend?: BackendConfigWithChained,
) {
  const hasSdk = backend?.sdk && typeof backend.sdk === 'function';
  const hasLoadPath = !!backend?.loadPath;
  const useChained = backend?._useChainedBackend;

  // If both loadPath and sdk are provided, use chained backend
  if (useChained && backend?._chainedBackendConfig) {
    i18nInstance.use(ChainedBackend);
    // Set the chained backend configuration with HTTP/FS backend first, then SDK backend
    // Use refreshAndUpdateStore mode by default to allow FS/HTTP resources to display first,
    // then SDK resources will update them asynchronously
    // Use BackendWithSave wrapper to ensure refresh logic is triggered
    if (i18nInstance.options) {
      const backendConfig = {
        backends: [BackendWithSave, SdkBackend],
        backendOptions: backend._chainedBackendConfig.backendOptions,
        cacheHitMode: backend.cacheHitMode || 'refreshAndUpdateStore',
      };
      i18nInstance.options.backend = backendConfig;
    }
    return;
  }

  // Legacy check: if both loadPath and sdk are provided, use chained backend
  if (hasLoadPath && hasSdk) {
    i18nInstance.use(ChainedBackend);
    if (i18nInstance.options) {
      i18nInstance.options.backend = {
        backends: [BackendWithSave, SdkBackend],
        backendOptions: [
          {
            loadPath: backend.loadPath,
            addPath: backend.addPath,
          },
          {
            sdk: backend.sdk,
          },
        ],
        // Use refreshAndUpdateStore mode by default to allow FS/HTTP resources to display first,
        // then SDK resources will update them asynchronously
        // Use BackendWithSave wrapper to ensure refresh logic is triggered
        cacheHitMode: backend.cacheHitMode || 'refreshAndUpdateStore',
      };
    }
    return;
  }

  // If only SDK is provided, use SDK backend
  if (hasSdk) {
    return i18nInstance.use(SdkBackend);
  }

  // Otherwise, use HTTP/FS backend
  // For non-chained backend, we still need to set the backend config
  // so that init() can use it to load resources
  if (i18nInstance.options && backend) {
    // Remove internal properties before setting
    const { _useChainedBackend, _chainedBackendConfig, ...cleanBackend } =
      backend || {};
    i18nInstance.options.backend = cleanBackend;
  }
  return i18nInstance.use(BackendBase);
}
