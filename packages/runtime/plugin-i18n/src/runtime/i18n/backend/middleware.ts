import ChainedBackend from 'i18next-chained-backend';
import Backend from 'i18next-http-backend';
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

  // Helper to configure chained backend
  function configureChainedBackend(
    i18nInstance: I18nInstance,
    backendOptions: any,
    cacheHitMode:
      | 'none'
      | 'refresh'
      | 'refreshAndUpdateStore' = 'refreshAndUpdateStore',
  ) {
    i18nInstance.use(ChainedBackend);
    if (i18nInstance.options) {
      i18nInstance.options.backend = {
        backends: [Backend, SdkBackend],
        backendOptions,
        cacheHitMode,
      };
    }
  }

  // If both loadPath and sdk are provided, use chained backend
  if (useChained && backend?._chainedBackendConfig) {
    configureChainedBackend(
      i18nInstance,
      backend._chainedBackendConfig.backendOptions,
      backend.cacheHitMode || 'refreshAndUpdateStore',
    );
    return;
  }

  // Legacy check: if both loadPath and sdk are provided, use chained backend
  if (hasLoadPath && hasSdk) {
    configureChainedBackend(
      i18nInstance,
      [
        {
          loadPath: backend.loadPath,
          addPath: backend.addPath,
        },
        {
          sdk: backend.sdk,
        },
      ],
      backend.cacheHitMode || 'refreshAndUpdateStore',
    );
    return;
  }

  // If only SDK is provided, use SDK backend
  if (hasSdk) {
    return i18nInstance.use(SdkBackend);
  }

  // Otherwise, use HTTP backend
  return i18nInstance.use(Backend);
};
