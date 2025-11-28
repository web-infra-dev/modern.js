import type { I18nSdkLoadOptions, I18nSdkLoader } from '../../../shared/type';
import type { Resources } from '../instance';

interface BackendOptions {
  sdk?: I18nSdkLoader;
  [key: string]: unknown;
}

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
      console.error('[i18n] SdkBackend.read - SDK function not initialized');
      callback(new Error('SDK function not initialized'), null);
      return;
    }

    const cached = this.allResourcesCache
      ? this.extractFromCache(language, namespace)
      : null;
    if (cached !== null) {
      callback(null, cached);
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
        if (shouldUpdateCache) {
          this.updateCache(language, namespace, formattedData);
          this.loadingPromises.delete(cacheKey);
        }
        callback(null, formattedData);
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

  private triggerI18nextUpdate(language: string, namespace: string): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('i18n-sdk-resources-loaded', {
        detail: { language, namespace },
      });
      window.dispatchEvent(event);
    }
  }
}
