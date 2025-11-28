import fs from 'fs';
import path from 'path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { getPublicDirRoutePrefixes } from '@modern-js/server-core';
import type { Entrypoint } from '@modern-js/types';
import type { BackendOptions, LocaleDetectionOptions } from '../shared/type';
import { getBackendOptions, getLocaleDetectionOptions } from '../shared/utils';

export type TransformRuntimeConfigFn = (
  extendedConfig: Record<string, any>,
  entrypoint: Entrypoint,
) => Record<string, any>;

/**
 * Check if a directory exists and contains JSON files
 */
function hasJsonFiles(dirPath: string): boolean {
  try {
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return false;
    }
    const entries = fs.readdirSync(dirPath);
    // Check if there are any JSON files in the directory or subdirectories
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry);
      const stat = fs.statSync(entryPath);
      if (stat.isFile() && entry.endsWith('.json')) {
        return true;
      }
      if (stat.isDirectory()) {
        // Recursively check subdirectories (e.g., locales/en/, locales/zh/)
        if (hasJsonFiles(entryPath)) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Auto-detect if locales directory exists with JSON files
 * Checks both project root and config/public directory
 */
function detectLocalesDirectory(
  appDirectory: string,
  normalizedConfig?: any,
): boolean {
  // Check project root directory
  const rootLocalesPath = path.join(appDirectory, 'locales');
  if (hasJsonFiles(rootLocalesPath)) {
    return true;
  }

  // Check config/public directory
  const configPublicPath = path.join(
    appDirectory,
    'config',
    'public',
    'locales',
  );
  if (hasJsonFiles(configPublicPath)) {
    return true;
  }

  // Check publicDir if configured
  const publicDir = normalizedConfig?.server?.publicDir;
  if (publicDir) {
    const publicDirPath = Array.isArray(publicDir) ? publicDir[0] : publicDir;
    const localesPath = path.isAbsolute(publicDirPath)
      ? path.join(publicDirPath, 'locales')
      : path.join(appDirectory, publicDirPath, 'locales');
    if (hasJsonFiles(localesPath)) {
      return true;
    }
  }

  return false;
}

export interface I18nPluginOptions {
  localeDetection?: LocaleDetectionOptions;
  backend?: BackendOptions;
  transformRuntimeConfig?: TransformRuntimeConfigFn;
  customPlugin?: {
    runtime?: {
      name?: string;
      path?: string;
    };
    server?: {
      name?: string;
    };
  };
  [key: string]: any;
}

export const i18nPlugin = (
  options: I18nPluginOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-i18n',
  setup: api => {
    const {
      localeDetection,
      backend,
      transformRuntimeConfig,
      customPlugin,
      ...restOptions
    } = options;

    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const localeDetectionOptions = localeDetection
        ? getLocaleDetectionOptions(entrypoint.entryName, localeDetection)
        : undefined;

      // Auto-detect locales directory and enable backend if:
      // 1. User didn't explicitly set backend.enabled to false
      // 2. Locales directory exists with JSON files
      // 3. If user configured loadPath or addPath, auto-enable backend without detection
      let backendOptions: BackendOptions | undefined;
      const { appDirectory } = api.getAppContext();
      const normalizedConfig = api.getNormalizedConfig();

      if (backend) {
        const entryBackendOptions = getBackendOptions(
          entrypoint.entryName,
          backend,
        );
        // If user explicitly set enabled to false, don't auto-detect
        if (entryBackendOptions?.enabled === false) {
          backendOptions = entryBackendOptions;
        } else {
          // If user configured loadPath or addPath, auto-enable backend
          // No need to detect locales directory since user has specified the path
          if (entryBackendOptions?.loadPath || entryBackendOptions?.addPath) {
            backendOptions = {
              ...entryBackendOptions,
              enabled: true,
            };
          } else if (entryBackendOptions?.enabled !== true) {
            // Auto-detect if enabled is not explicitly true and no loadPath/addPath configured
            const hasLocales = detectLocalesDirectory(
              appDirectory,
              normalizedConfig,
            );

            if (hasLocales) {
              // Auto-enable backend if locales directory is detected
              backendOptions = {
                ...entryBackendOptions,
                enabled: true,
              };
            } else {
              backendOptions = entryBackendOptions;
            }
          } else {
            backendOptions = entryBackendOptions;
          }
        }
      } else {
        // No backend config provided, try auto-detection
        const hasLocales = detectLocalesDirectory(
          appDirectory,
          normalizedConfig,
        );

        if (hasLocales) {
          // Auto-enable backend if locales directory is detected
          backendOptions = getBackendOptions(entrypoint.entryName, {
            enabled: true,
          });
        }
      }

      const { metaName } = api.getAppContext();

      // Transform extended config if transform function is provided
      let extendedConfig = restOptions;
      if (transformRuntimeConfig) {
        extendedConfig = transformRuntimeConfig(
          restOptions,
          entrypoint as Entrypoint,
        );
      }

      // Build final config with base config and transformed extended config
      const config = {
        entryName: entrypoint.entryName,
        localeDetection: localeDetectionOptions,
        backend: backendOptions,
        ...extendedConfig,
      };

      plugins.push({
        name: customPlugin?.runtime?.name || 'i18n',
        path: customPlugin?.runtime?.path || `@${metaName}/plugin-i18n/runtime`,
        config,
      });
      return {
        entrypoint,
        plugins,
      };
    });

    api._internalServerPlugins(({ plugins }) => {
      const { serverRoutes, metaName } = api.getAppContext();
      const normalizedConfig = api.getNormalizedConfig();

      let staticRoutePrefixes: string[] = [];
      if (serverRoutes && Array.isArray(serverRoutes)) {
        // Get static route prefixes from 'public' directories
        // 'public' routes are handled by static plugin
        staticRoutePrefixes = serverRoutes
          .filter(
            route => !route.entryName && route.entryPath.startsWith('public'),
          )
          .map(route => route.urlPath)
          .filter(Boolean);
      }

      // Also include publicDir configuration paths
      // publicDir files are copied to dist/{dir}/ and should be treated as static resources
      const publicDirPrefixes = getPublicDirRoutePrefixes(
        normalizedConfig?.server?.publicDir,
      );
      publicDirPrefixes.forEach(prefix => {
        if (!staticRoutePrefixes.includes(prefix)) {
          staticRoutePrefixes.push(prefix);
        }
      });

      plugins.push({
        name: customPlugin?.server?.name || `@${metaName}/plugin-i18n/server`,
        options: {
          localeDetection,
          staticRoutePrefixes,
        },
      });
      return { plugins };
    });
  },
});

export default i18nPlugin;
