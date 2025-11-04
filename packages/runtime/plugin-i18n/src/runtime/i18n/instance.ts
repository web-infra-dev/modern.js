// simple i18n instance definition
export interface I18nInstance {
  language: string;
  isInitialized: boolean;
  init: (options?: I18nInitOptions) => void | Promise<void>;
  changeLanguage: (lang?: string) => void | Promise<void>;
  use: (plugin: any) => void;
  createInstance: (options?: I18nInitOptions) => I18nInstance;
  cloneInstance?: () => I18nInstance; // ssr need
}

type LanguageDetectorOrder = string[];
type LanguageDetectorCaches = boolean | string[];
export interface LanguageDetectorOptions {
  order?: LanguageDetectorOrder;
  lookupQuerystring?: string;
  lookupCookie?: string;
  lookupSession?: string;
  lookupFromPathIndex?: number;
  caches?: LanguageDetectorCaches;
  cookieExpirationDate?: Date;
  cookieDomain?: string;
}

export type I18nInitOptions = {
  lng?: string;
  fallbackLng?: string;
  supportedLngs?: string[];
  initImmediate?: boolean;
  detection?: LanguageDetectorOptions;
};

export function isI18nInstance(obj: any): obj is I18nInstance {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.init === 'function' &&
    typeof obj.use === 'function'
  );
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
    // Create a new instance without auto-initialization
    // Use initImmediate: false to prevent auto-init
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

export async function getI18nInstance(
  userInstance?: I18nInstance,
): Promise<I18nInstance> {
  if (userInstance) {
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
