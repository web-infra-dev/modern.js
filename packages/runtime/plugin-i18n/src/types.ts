import type { I18nInitOptions, I18nInstance } from './runtime/i18n';

declare module '@modern-js/runtime' {
  interface RuntimeConfig {
    i18n?: {
      i18nInstance?: I18nInstance;
      changeLanguage?: (lang: string) => void;
      setLang?: (lang: string) => void;
      initOptions?: I18nInitOptions;
    };
  }

  interface TInternalRuntimeContext {
    i18nInstance?: I18nInstance;
    changeLanguage?: (lang: string) => Promise<void>;
  }
}
