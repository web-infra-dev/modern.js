import type {
  LanguageDetectorOptions,
  Resources,
} from '../runtime/i18n/instance';

export interface BaseLocaleDetectionOptions {
  localePathRedirect?: boolean;
  i18nextDetector?: boolean;
  languages?: string[];
  fallbackLanguage?: string;
  detection?: LanguageDetectorOptions;
  ignoreRedirectRoutes?: string[] | ((pathname: string) => boolean);
}

export interface LocaleDetectionOptions extends BaseLocaleDetectionOptions {
  localeDetectionByEntry?: Record<string, BaseLocaleDetectionOptions>;
}

/**
 * Options for loading i18n resources via SDK
 */
export interface I18nSdkLoadOptions {
  /** Single language code to load (e.g., 'en', 'zh') */
  lng?: string;
  /** Single namespace to load (e.g., 'translation', 'common') */
  ns?: string;
  /** Multiple language codes to load */
  lngs?: string[];
  /** Multiple namespaces to load */
  nss?: string[];
  /** Load all available languages and namespaces */
  all?: boolean;
}

/**
 * SDK function to load i18n resources
 * Supports multiple loading modes:
 * 1. Single resource: sdk({ lng: 'en', ns: 'translation' })
 * 2. Batch by languages: sdk({ lngs: ['en', 'zh'], ns: 'translation' })
 * 3. Batch by namespaces: sdk({ lng: 'en', nss: ['translation', 'common'] })
 * 4. Batch by both: sdk({ lngs: ['en', 'zh'], nss: ['translation', 'common'] })
 * 5. Load all: sdk({ all: true }) or sdk()
 *
 * @param options - Loading options
 * @returns Promise that resolves to resources object or the resources object directly
 *          Resources format: { [lng]: { [ns]: { [key]: value } } }
 */
export type I18nSdkLoader = (
  options: I18nSdkLoadOptions,
) => Promise<Resources> | Resources;

/**
 * Chained backend configuration
 * Used internally when both loadPath and sdk are provided
 */
export interface ChainedBackendConfig {
  _useChainedBackend: boolean;
  _chainedBackendConfig: {
    backendOptions: Array<Record<string, unknown>>;
  };
  cacheHitMode?: 'none' | 'refresh' | 'refreshAndUpdateStore';
}

/**
 * Extended backend options that may include chained backend configuration
 */
export type ExtendedBackendOptions = BaseBackendOptions &
  Partial<ChainedBackendConfig>;

export interface BaseBackendOptions {
  enabled?: boolean;
  loadPath?: string;
  addPath?: string;
  /**
   * Cache hit mode for chained backend (only effective when both `loadPath` and `sdk` are provided)
   *
   * - `'none'` (default): If the first backend returns resources, stop and don't try the next backend
   * - `'refresh'`: Try to refresh the cache by loading from the next backend and update the cache
   * - `'refreshAndUpdateStore'`: Try to refresh the cache by loading from the next backend,
   *   update the cache and also update the i18next resource store. This allows FS/HTTP resources
   *   to be displayed first, then SDK resources will update them asynchronously.
   *
   * @default 'refreshAndUpdateStore' when both loadPath and sdk are provided
   */
  cacheHitMode?: 'none' | 'refresh' | 'refreshAndUpdateStore';
  /**
   * SDK function to load i18n resources dynamically
   *
   * **Important**: In `modern.config.ts`, you can only set this to `true` or any identifier
   * to enable SDK mode. The actual SDK function must be provided in `modern.runtime.ts`
   * via `initOptions.backend.sdk`.
   *
   * When both `loadPath` (or FS backend) and `sdk` are provided, the plugin will automatically
   * use `i18next-chained-backend` to chain multiple backends. The order will be:
   * 1. HTTP/FS backend (primary) - loads from `loadPath` or file system first for quick initial display
   * 2. SDK backend (fallback/update) - loads from the SDK function to update/refresh translations
   *
   * With `cacheHitMode: 'refreshAndUpdateStore'` (default), FS/HTTP resources will be displayed
   * immediately, then SDK resources will be loaded asynchronously to update the translations.
   *
   * If only `sdk` is provided, it will be used instead of the default HTTP/FS backend
   *
   * @example In modern.config.ts - enable SDK mode
   * ```ts
   * backend: {
   *   enabled: true,
   *   sdk: true, // or any identifier, just to enable SDK mode
   * }
   * ```
   *
   * @example In modern.runtime.ts - provide the actual SDK function
   * ```ts
   * export default defineRuntimeConfig({
   *   i18n: {
   *     initOptions: {
   *       backend: {
   *         sdk: async (options) => {
   *           // Your SDK implementation
   *           if (options.all) {
   *             return await mySdk.getAllResources();
   *           }
   *           if (options.lng && options.ns) {
   *             return await mySdk.getResource(options.lng, options.ns);
   *           }
   *           // Handle other cases...
   *         }
   *       }
   *     }
   *   }
   * });
   * ```
   *
   * @example Single resource loading
   * ```ts
   * sdk: async (options) => {
   *   if (options.lng && options.ns) {
   *     const response = await fetch(`/api/i18n/${options.lng}/${options.ns}`);
   *     return response.json();
   *   }
   * }
   * ```
   *
   * @example Load all resources at once
   * ```ts
   * sdk: async (options) => {
   *   if (options?.all) {
   *     // Load all languages and namespaces
   *     return await mySdk.getAllResources();
   *   }
   *   // Handle other cases...
   * }
   * ```
   *
   * @example Batch loading
   * ```ts
   * sdk: async (options) => {
   *   if (options?.lngs && options?.nss) {
   *     // Load multiple languages and namespaces
   *     return await mySdk.getBatchResources(options.lngs, options.nss);
   *   }
   *   // Handle single or other cases...
   * }
   * ```
   */
  sdk?: I18nSdkLoader | boolean | string;
}

export interface BackendOptions extends BaseBackendOptions {
  backendOptionsByEntry?: Record<string, BaseBackendOptions>;
}
