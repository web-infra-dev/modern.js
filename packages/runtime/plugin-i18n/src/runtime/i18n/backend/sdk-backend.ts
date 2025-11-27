import type { I18nSdkLoadOptions, I18nSdkLoader } from '../../../shared/type';
import type { Resources } from '../instance';

/**
 * i18next backend options interface
 */
interface BackendOptions {
  sdk?: I18nSdkLoader;
  [key: string]: unknown;
}

/**
 * Custom i18next backend that uses SDK to load resources
 */
export class SdkBackend {
  static type = 'backend';
  type = 'backend' as const;
  sdk?: I18nSdkLoader;
  private allResourcesCache: Resources | null = null;
  private loadingPromises = new Map<string, Promise<unknown>>();

  constructor(_services: unknown, _options: Record<string, unknown>) {
    void _services;
    void _options;
  }

  init(
    _services: unknown,
    backendOptions: BackendOptions,
    _i18nextOptions: unknown,
  ): void {
    void _services;
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
      callback(new Error('SDK function not initialized'), null);
      return;
    }

    if (this.allResourcesCache) {
      const cached = this.extractFromCache(language, namespace);
      if (cached !== null) {
        callback(null, cached);
        return;
      }
    }

    const cacheKey = `${language}:${namespace}`;
    const existingPromise = this.loadingPromises.get(cacheKey);
    if (existingPromise) {
      existingPromise
        .then(data => {
          const formattedData = this.formatResources(data, language, namespace);
          callback(null, formattedData);
        })
        .catch(error => {
          callback(
            error instanceof Error ? error : new Error(String(error)),
            null,
          );
        });
      return;
    }

    try {
      const result = this.callSdk(language, namespace);
      const loadPromise =
        result instanceof Promise ? result : Promise.resolve(result);

      this.loadingPromises.set(cacheKey, loadPromise);

      loadPromise
        .then(data => {
          const formattedData = this.formatResources(data, language, namespace);
          this.updateCache(language, namespace, formattedData);
          this.loadingPromises.delete(cacheKey);
          callback(null, formattedData);
        })
        .catch(error => {
          this.loadingPromises.delete(cacheKey);
          callback(
            error instanceof Error ? error : new Error(String(error)),
            null,
          );
        });
    } catch (error) {
      callback(error instanceof Error ? error : new Error(String(error)), null);
    }
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
    if (!langData || typeof langData !== 'object') {
      return null;
    }

    const nsData = langData[namespace];
    if (!nsData || typeof nsData !== 'object') {
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

    if (data && typeof data === 'object') {
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
    if (!data || typeof data !== 'object') {
      return {};
    }

    const dataObj = data as Record<string, unknown>;

    const langData = dataObj[language];
    if (langData && typeof langData === 'object') {
      const nsData = (langData as Record<string, unknown>)[namespace];
      if (nsData && typeof nsData === 'object') {
        return nsData as Record<string, string>;
      }
    }

    const hasLanguageKeys = Object.keys(dataObj).some(
      key => dataObj[key] && typeof dataObj[key] === 'object',
    );
    if (!hasLanguageKeys) {
      return dataObj as Record<string, string>;
    }

    return {};
  }

  create(
    _languages: string[],
    _namespace: string,
    _key: string,
    _fallbackValue: string,
  ): void {
    // Not implemented - translations are managed by the external SDK service.
    // This method is called by i18next when saveMissing is enabled and addPath is configured.
    // For SDK backend, missing translations should be managed through the external SDK service,
    // not saved at runtime.
  }

  /**
   * Check if a specific resource is currently loading
   * @param language - Language code
   * @param namespace - Namespace
   * @returns true if the resource is currently loading, false otherwise
   */
  isLoading(language: string, namespace: string): boolean {
    const cacheKey = `${language}:${namespace}`;
    return this.loadingPromises.has(cacheKey);
  }

  /**
   * Get all currently loading resources
   * @returns Array of objects containing language and namespace of loading resources
   */
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

  /**
   * Check if any resource is currently loading
   * @returns true if any resource is loading, false otherwise
   */
  hasLoadingResources(): boolean {
    return this.loadingPromises.size > 0;
  }
}
