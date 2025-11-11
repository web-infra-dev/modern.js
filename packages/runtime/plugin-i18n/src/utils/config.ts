/**
 * Base locale detection configuration for a single entry
 */
export interface BaseLocaleDetectionOptions {
  /** Whether to enable locale detection from path and automatic redirect */
  localePathRedirect?: boolean;
  /** List of supported languages */
  languages?: string[];
  /** Fallback language when detection fails */
  fallbackLanguage?: string;
}

/**
 * Locale detection configuration that supports both global and per-entry settings
 */
export interface LocaleDetectionOptions extends BaseLocaleDetectionOptions {
  /** Per-entry locale detection configurations */
  localeDetectionByEntry?: Record<string, BaseLocaleDetectionOptions>;
}

/**
 * Gets the locale detection options for a specific entry, falling back to global config
 * @param entryName - The name of the entry to get options for
 * @param localeDetection - The global locale detection configuration
 * @returns The resolved locale detection options for the entry
 */
export const getLocaleDetectionOptions = (
  entryName: string,
  localeDetection: BaseLocaleDetectionOptions,
): BaseLocaleDetectionOptions => {
  // Type guard to check if the config has localeDetectionByEntry
  const hasEntryConfig = (
    config: BaseLocaleDetectionOptions,
  ): config is LocaleDetectionOptions =>
    config &&
    typeof config === 'object' &&
    (config as any).localeDetectionByEntry !== undefined;

  if (hasEntryConfig(localeDetection)) {
    const { localeDetectionByEntry, ...globalConfig } = localeDetection;
    const entryConfig = localeDetectionByEntry?.[entryName];
    // Merge entry-specific config with global config, entry config takes precedence
    if (entryConfig) {
      return {
        ...globalConfig,
        ...entryConfig,
      };
    }
    return globalConfig;
  }

  return localeDetection;
};
