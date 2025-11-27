import ChainedBackend from 'i18next-chained-backend';
import Backend from 'i18next-fs-backend';
import type { BaseBackendOptions } from '../../../shared/type';
import type { I18nInstance } from '../instance';
import { SdkBackend } from './sdk-backend';

export const useI18nextBackend = (
  i18nInstance: I18nInstance,
  backend?: BaseBackendOptions & {
    _useChainedBackend?: boolean;
    _chainedBackendConfig?: any;
  },
) => {
  const hasSdk = backend?.sdk && typeof backend.sdk === 'function';
  const hasLoadPath = !!backend?.loadPath;
  const useChained = backend?._useChainedBackend;

  // If both loadPath and sdk are provided, use chained backend
  if (useChained && backend?._chainedBackendConfig) {
    i18nInstance.use(ChainedBackend);
    // Set the chained backend configuration with FS backend first, then SDK backend
    // Use refreshAndUpdateStore mode by default to allow FS/HTTP resources to display first,
    // then SDK resources will update them asynchronously
    if (i18nInstance.options) {
      i18nInstance.options.backend = {
        backends: [Backend, SdkBackend],
        backendOptions: backend._chainedBackendConfig.backendOptions,
        cacheHitMode: backend.cacheHitMode || 'refreshAndUpdateStore',
      };
    }
    return;
  }

  // Legacy check: if both loadPath and sdk are provided, use chained backend
  if (hasLoadPath && hasSdk) {
    i18nInstance.use(ChainedBackend);
    if (i18nInstance.options) {
      i18nInstance.options.backend = {
        backends: [Backend, SdkBackend],
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
        cacheHitMode: backend.cacheHitMode || 'refreshAndUpdateStore',
      };
    }
    return;
  }

  // If only SDK is provided, use SDK backend
  if (hasSdk) {
    return i18nInstance.use(SdkBackend);
  }

  // Otherwise, use FS backend
  return i18nInstance.use(Backend);
};
