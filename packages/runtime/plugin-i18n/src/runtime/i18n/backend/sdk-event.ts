export const I18N_SDK_RESOURCES_LOADED_EVENT = 'i18n-sdk-resources-loaded';

const I18N_SDK_BACKEND_ID_KEY = '__modern_i18n_sdk_backend_id__';

let sdkBackendInstanceCount = 0;

export interface I18nSdkResourcesLoadedEventDetail {
  language: string;
  namespace: string;
  backendId?: string;
}

export function createI18nSdkBackendId(): string {
  sdkBackendInstanceCount += 1;
  return `modern-i18n-sdk-backend-${sdkBackendInstanceCount}`;
}

export function setI18nSdkBackendId(target: unknown, backendId: string): void {
  if (!target || typeof target !== 'object') {
    return;
  }

  Object.defineProperty(target, I18N_SDK_BACKEND_ID_KEY, {
    configurable: true,
    enumerable: false,
    value: backendId,
    writable: true,
  });
}

export function getI18nSdkBackendId(target: unknown): string | undefined {
  if (!target || typeof target !== 'object') {
    return undefined;
  }

  return (target as Record<string, unknown>)[I18N_SDK_BACKEND_ID_KEY] as
    | string
    | undefined;
}
