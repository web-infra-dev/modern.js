import ChainedBackend from 'i18next-chained-backend';
import type {
  BaseBackendOptions,
  ChainedBackendConfig,
} from '../../../shared/type';
import type { I18nInstance } from '../instance';
import { getActualI18nextInstance } from '../instance';
import { SdkBackend } from './sdk-backend';

type BackendConfigWithChained = BaseBackendOptions &
  Partial<ChainedBackendConfig>;

function checkBackendConfig(backend?: BackendConfigWithChained) {
  const hasSdk = backend?.sdk && typeof backend.sdk === 'function';
  const hasLoadPath = !!backend?.loadPath;
  const useChained = backend?._useChainedBackend;

  return { hasSdk, hasLoadPath, useChained };
}

function buildChainedBackendConfig(
  backend: BackendConfigWithChained,
  BackendWithSave: new (...args: any[]) => any,
) {
  const cacheHitMode = backend.cacheHitMode || 'refreshAndUpdateStore';

  if (backend._chainedBackendConfig) {
    return {
      backends: [BackendWithSave, SdkBackend],
      backendOptions: backend._chainedBackendConfig.backendOptions,
      cacheHitMode,
    };
  }

  // Legacy: build chained backend config from backend options
  return {
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
    cacheHitMode,
  };
}

function setupChainedBackend(
  i18nInstance: I18nInstance,
  backend: BackendConfigWithChained,
  BackendWithSave: new (...args: any[]) => any,
) {
  i18nInstance.use(ChainedBackend);
  const actualInstance = getActualI18nextInstance(i18nInstance);
  if (actualInstance?.options) {
    actualInstance.options.backend = buildChainedBackendConfig(
      backend,
      BackendWithSave,
    );
  }
  if (i18nInstance.options) {
    i18nInstance.options.backend = buildChainedBackendConfig(
      backend,
      BackendWithSave,
    );
  }
}

function cleanBackendConfig(backend: BackendConfigWithChained) {
  const { _useChainedBackend, _chainedBackendConfig, ...cleanBackend } =
    backend;
  return cleanBackend;
}

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
  BackendWithSave: new (...args: any[]) => any,
  BackendBase: new (...args: any[]) => any,
  backend?: BackendConfigWithChained,
) {
  if (!backend) {
    return i18nInstance.use(BackendBase);
  }

  const { hasSdk, hasLoadPath, useChained } = checkBackendConfig(backend);

  if (useChained || (hasLoadPath && hasSdk)) {
    setupChainedBackend(i18nInstance, backend, BackendWithSave);
    return;
  }

  if (hasSdk) {
    return i18nInstance.use(SdkBackend);
  }

  const actualInstance = getActualI18nextInstance(i18nInstance);
  if (actualInstance?.options) {
    actualInstance.options.backend = cleanBackendConfig(backend);
  }
  if (i18nInstance.options) {
    i18nInstance.options.backend = cleanBackendConfig(backend);
  }
  return i18nInstance.use(BackendBase);
}
