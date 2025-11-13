import type {
  BackendOptions,
  BaseBackendOptions,
  BaseLocaleDetectionOptions,
  LocaleDetectionOptions,
} from './type';

export function getEntryConfig<T extends Record<string, any>>(
  entryName: string,
  config: T,
  entryKey: string,
): T | undefined {
  const entryConfigMap = (config as any)[entryKey] as
    | Record<string, T>
    | undefined;
  return entryConfigMap?.[entryName];
}

export function removeEntryConfigKey<T extends Record<string, any>>(
  config: T,
  entryKey: string,
): Omit<T, typeof entryKey> {
  const { [entryKey]: _, ...rest } = config;
  return rest;
}

export function getLocaleDetectionOptions(
  entryName: string,
  localeDetection: BaseLocaleDetectionOptions,
): BaseLocaleDetectionOptions {
  const fullConfig = localeDetection as LocaleDetectionOptions;
  const entryConfig = getEntryConfig(
    entryName,
    fullConfig,
    'localeDetectionByEntry',
  );

  if (entryConfig) {
    const globalConfig = removeEntryConfigKey(
      fullConfig,
      'localeDetectionByEntry',
    );
    return {
      ...globalConfig,
      ...entryConfig,
    };
  }

  if ('localeDetectionByEntry' in fullConfig) {
    return removeEntryConfigKey(fullConfig, 'localeDetectionByEntry');
  }

  return localeDetection;
}

export function getBackendOptions(
  entryName: string,
  backend: BaseBackendOptions,
): BaseBackendOptions {
  const fullConfig = backend as BackendOptions;
  const entryConfig = getEntryConfig(
    entryName,
    fullConfig,
    'backendOptionsByEntry',
  );
  if (entryConfig) {
    const globalConfig = removeEntryConfigKey(
      fullConfig,
      'backendOptionsByEntry',
    );
    return {
      ...globalConfig,
      ...entryConfig,
    };
  }

  if ('backendOptionsByEntry' in fullConfig) {
    return removeEntryConfigKey(fullConfig, 'backendOptionsByEntry');
  }

  return backend;
}
