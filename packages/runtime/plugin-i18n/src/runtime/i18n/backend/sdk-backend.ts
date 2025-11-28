import type { I18nSdkLoadOptions, I18nSdkLoader } from '../../../shared/type';
import type { Resources } from '../instance';

interface BackendOptions {
  sdk?: I18nSdkLoader;
  [key: string]: unknown;
}

interface I18nextServices {
  resourceStore?: {
    data?: {
      [language: string]: {
        [namespace: string]: Record<string, string>;
      };
    };
  };
  store?: {
    data?: {
      [language: string]: {
        [namespace: string]: Record<string, string>;
      };
    };
  };
  [key: string]: any;
}

export class SdkBackend {
  static type = 'backend';
  type = 'backend' as const;
  sdk?: I18nSdkLoader;
  private allResourcesCache: Resources | null = null;
  private loadingPromises = new Map<string, Promise<unknown>>();
  private services?: I18nextServices;

  constructor(_services: unknown, _options: Record<string, unknown>) {
    void _services;
    void _options;
  }

  init(
    services: I18nextServices,
    backendOptions: BackendOptions,
    _i18nextOptions: unknown,
  ): void {
    this.services = services;
    void _i18nextOptions;
    this.sdk = backendOptions?.sdk;
    if (!this.sdk) {
      throw new Error(
        'SdkBackend requires an SDK function to be provided in backend options',
      );
    }
  }

  read(
    language: string,
    namespace: string,
    callback: (error: Error | null, data: unknown) => void,
  ) {
    if (!this.sdk) {
      console.error('[i18n] SdkBackend.read - SDK function not initialized');
      callback(new Error('SDK function not initialized'), null);
      return;
    }

    const cached = this.allResourcesCache
      ? this.extractFromCache(language, namespace)
      : null;
    if (cached !== null) {
      // Merge cached data with existing store data to preserve HTTP backend data
      const mergedData = this.mergeWithExistingResources(
        language,
        namespace,
        cached,
      );
      callback(null, mergedData);
      return;
    }

    const cacheKey = this.getCacheKey(language, namespace);
    const existingPromise = this.loadingPromises.get(cacheKey);
    if (existingPromise) {
      this.handlePromise(existingPromise, language, namespace, callback, false);
      return;
    }

    this.loadResource(language, namespace, callback);
  }

  create(
    _languages: string[],
    _namespace: string,
    _key: string,
    _fallbackValue: string,
  ): void {
    // Not implemented - translations are managed by the external SDK service
  }

  isLoading(language: string, namespace: string): boolean {
    return this.loadingPromises.has(this.getCacheKey(language, namespace));
  }

  getLoadingResources(): Array<{ language: string; namespace: string }> {
    const loading: Array<{ language: string; namespace: string }> = [];
    for (const key of this.loadingPromises.keys()) {
      const [language, namespace] = key.split(':');
      if (language && namespace) {
        loading.push({ language, namespace });
      }
    }
    return loading;
  }

  hasLoadingResources(): boolean {
    return this.loadingPromises.size > 0;
  }

  private getCacheKey(language: string, namespace: string): string {
    return `${language}:${namespace}`;
  }

  private loadResource(
    language: string,
    namespace: string,
    callback: (error: Error | null, data: unknown) => void,
  ): void {
    try {
      const result = this.callSdk(language, namespace);
      const loadPromise =
        result instanceof Promise ? result : Promise.resolve(result);
      const cacheKey = this.getCacheKey(language, namespace);

      this.loadingPromises.set(cacheKey, loadPromise);

      this.handlePromise(loadPromise, language, namespace, callback, true);
    } catch (error) {
      callback(this.normalizeError(error), null);
    }
  }

  private handlePromise(
    promise: Promise<unknown>,
    language: string,
    namespace: string,
    callback: (error: Error | null, data: unknown) => void,
    shouldUpdateCache: boolean,
  ): void {
    const cacheKey = this.getCacheKey(language, namespace);

    promise
      .then(data => {
        const formattedData = this.formatResources(data, language, namespace);
        // Merge with existing resources in store to preserve data from other backends (e.g., HTTP backend)
        // This is important when using refreshAndUpdateStore mode in chained backend
        const mergedData = this.mergeWithExistingResources(
          language,
          namespace,
          formattedData,
        );
        if (shouldUpdateCache) {
          this.updateCache(language, namespace, mergedData);
          this.loadingPromises.delete(cacheKey);
        }
        callback(null, mergedData);
        this.triggerI18nextUpdate(language, namespace);
      })
      .catch(error => {
        if (shouldUpdateCache) {
          this.loadingPromises.delete(cacheKey);
        }
        callback(this.normalizeError(error), null);
      });
  }

  private normalizeError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  private callSdk(
    language: string,
    namespace: string,
  ): Promise<Resources> | Resources {
    if (!this.sdk) {
      throw new Error('SDK function not initialized');
    }

    const options: I18nSdkLoadOptions = { lng: language, ns: namespace };
    return this.sdk(options);
  }

  private extractFromCache(
    language: string,
    namespace: string,
  ): Record<string, string> | null {
    if (!this.allResourcesCache) {
      return null;
    }

    const langData = this.allResourcesCache[language];
    if (!this.isObject(langData)) {
      return null;
    }

    const nsData = langData[namespace];
    if (!this.isObject(nsData)) {
      return null;
    }

    return nsData as Record<string, string>;
  }

  private updateCache(
    language: string,
    namespace: string,
    data: unknown,
  ): void {
    if (!this.allResourcesCache) {
      this.allResourcesCache = {};
    }

    if (!this.allResourcesCache[language]) {
      this.allResourcesCache[language] = {};
    }

    if (this.isObject(data)) {
      this.allResourcesCache[language][namespace] = data as Record<
        string,
        string
      >;
    }
  }

  private formatResources(
    data: unknown,
    language: string,
    namespace: string,
  ): Record<string, string> {
    if (!this.isObject(data)) {
      return {};
    }

    const dataObj = data as Record<string, unknown>;
    const langData = dataObj[language];

    if (this.isObject(langData)) {
      const nsData = (langData as Record<string, unknown>)[namespace];
      if (this.isObject(nsData)) {
        return nsData as Record<string, string>;
      }
    }

    const hasLanguageKeys = Object.keys(dataObj).some(key =>
      this.isObject(dataObj[key]),
    );
    if (!hasLanguageKeys) {
      return dataObj as Record<string, string>;
    }

    return {};
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object';
  }

  private mergeWithExistingResources(
    language: string,
    namespace: string,
    sdkData: Record<string, string>,
  ): Record<string, string> {
    // Get existing resources from store (may contain data from HTTP backend)
    const store = this.services?.resourceStore || this.services?.store;
    const existingData =
      store?.data?.[language]?.[namespace] || ({} as Record<string, string>);

    // Merge: preserve existing data (from HTTP backend), add/update with SDK data
    // This ensures that when using refreshAndUpdateStore, HTTP backend data is not lost
    return {
      ...existingData,
      ...sdkData,
    };
  }

  private triggerI18nextUpdate(language: string, namespace: string): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('i18n-sdk-resources-loaded', {
        detail: { language, namespace },
      });
      window.dispatchEvent(event);
    }
  }
}
