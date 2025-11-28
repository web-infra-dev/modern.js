import type { BaseBackendOptions } from '../../shared/type';

export interface I18nResourceStore {
  data?: {
    [language: string]: {
      [namespace: string]: Record<string, string>;
    };
  };
  addResourceBundle?: (
    language: string,
    namespace: string,
    resources: Record<string, string>,
    deep?: boolean,
    overwrite?: boolean,
  ) => void;
}

export function isI18nWrapperInstance(obj: any): boolean {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.i18nInstance &&
    typeof obj.i18nInstance === 'object' &&
    obj.i18nInstance.instance &&
    typeof obj.init === 'function' &&
    typeof obj.use === 'function'
  );
}

export function getI18nWrapperI18nextInstance(wrapperInstance: any): any {
  if (isI18nWrapperInstance(wrapperInstance)) {
    return wrapperInstance.i18nInstance?.instance;
  }
  return null;
}

export function getActualI18nextInstance(instance: I18nInstance | any): any {
  if (isI18nWrapperInstance(instance)) {
    const i18nextInstance = getI18nWrapperI18nextInstance(instance);
    return i18nextInstance || instance;
  }
  return instance;
}

export interface I18nInstance {
  language: string;
  isInitialized: boolean;
  init: (options?: I18nInitOptions) => void | Promise<void>;
  changeLanguage?: (lang: string) => void | Promise<void>;
  setLang?: (lang: string) => void | Promise<void>;
  use: (plugin: any) => void;
  createInstance: (options?: I18nInitOptions) => I18nInstance;
  cloneInstance?: () => I18nInstance; // ssr need
  // i18next store (may not be in type definition but exists at runtime)
  store?: I18nResourceStore;
  emit?: (event: string, ...args: any[]) => void;
  reloadResources?: (language?: string, namespace?: string) => Promise<void>;
  services?: {
    languageDetector?: {
      detect: (request?: any, options?: any) => string | string[] | undefined;
      [key: string]: any;
    };
    resourceStore?: I18nResourceStore;
    backend?: any; // Backend instance (e.g., SdkBackend)
    [key: string]: any;
  };
  // i18next instance options (available after initialization)
  options?: {
    backend?: BackendOptions;
    [key: string]: any;
  };
  [key: string]: any;
}

type LanguageDetectorOrder = string[];
type LanguageDetectorCaches = boolean | string[];
export interface LanguageDetectorOptions {
  order?: LanguageDetectorOrder;
  lookupQuerystring?: string;
  lookupCookie?: string;
  lookupLocalStorage?: string;
  lookupSession?: string;
  lookupFromPathIndex?: number;
  caches?: LanguageDetectorCaches;
  cookieExpirationDate?: Date;
  cookieDomain?: string;
  lookupHeader?: string;
}

export interface BackendOptions extends Omit<BaseBackendOptions, 'enabled'> {
  parse?: (data: string) => any;
  stringify?: (data: any) => string;
  [key: string]: any;
}

export interface Resources {
  [lng: string]: {
    [source: string]: string | Record<string, string>;
  };
}

export type I18nInitOptions = {
  lng?: string;
  fallbackLng?: string;
  supportedLngs?: string[];
  initImmediate?: boolean;
  detection?: LanguageDetectorOptions;
  backend?: BackendOptions;
  resources?: Resources;
  ns?: string | string[];
  defaultNS?: string | string[];
  react?: {
    useSuspense?: boolean;
    [key: string]: any;
  };
};

export function isI18nInstance(obj: any): obj is I18nInstance {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  if (isI18nWrapperInstance(obj)) {
    return true;
  }

  return typeof obj.init === 'function' && typeof obj.use === 'function';
}

async function tryImportI18next(): Promise<I18nInstance | null> {
  try {
    const i18next = await import('i18next');
    return i18next.default as unknown as I18nInstance;
  } catch (error) {
    return null;
  }
}

async function createI18nextInstance(): Promise<I18nInstance | null> {
  try {
    const i18next = await tryImportI18next();
    if (!i18next) {
      return null;
    }
    return i18next.createInstance({
      initImmediate: false,
    }) as unknown as I18nInstance;
  } catch (error) {
    return null;
  }
}

async function tryImportReactI18next() {
  try {
    const reactI18next = await import('react-i18next');
    return reactI18next;
  } catch (error) {
    return null;
  }
}

export function getI18nextInstanceForProvider(
  instance: I18nInstance | any,
): any {
  if (isI18nWrapperInstance(instance)) {
    const i18nextInstance = getI18nWrapperI18nextInstance(instance);
    if (i18nextInstance) {
      return i18nextInstance;
    }
  }

  return instance;
}

export async function getI18nInstance(
  userInstance?: I18nInstance | any,
): Promise<I18nInstance> {
  if (userInstance) {
    if (isI18nWrapperInstance(userInstance)) {
      return userInstance as I18nInstance;
    }

    if (isI18nInstance(userInstance)) {
      return userInstance;
    }
  }

  const i18nextInstance = await createI18nextInstance();
  if (i18nextInstance) {
    return i18nextInstance;
  }

  throw new Error('No i18n instance found');
}

export async function getInitReactI18next() {
  const reactI18nextModule = await tryImportReactI18next();
  if (reactI18nextModule) {
    return reactI18nextModule.initReactI18next;
  }
  return null;
}

export async function getI18nextProvider() {
  const reactI18nextModule = await tryImportReactI18next();
  if (reactI18nextModule) {
    return reactI18nextModule.I18nextProvider;
  }
  return null;
}
