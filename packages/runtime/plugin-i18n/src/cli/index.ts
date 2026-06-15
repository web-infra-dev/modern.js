import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { getPublicDirRoutePrefixes } from '@modern-js/server-core';
import type { Entrypoint } from '@modern-js/types';
import type { BackendOptions, LocaleDetectionOptions } from '../shared/type';
import { getBackendOptions, getLocaleDetectionOptions } from '../shared/utils';
import { applyDetectedBackendPaths, detectLocalesDirectory } from './locales';
import '../runtime/types';

export type TransformRuntimeConfigFn = (
  extendedConfig: Record<string, any>,
  entrypoint: Entrypoint,
) => Record<string, any>;

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
      // 3. If user configured loadPath or addPath, auto-enable backend
      let backendOptions: BackendOptions | undefined;
      const { appDirectory } = api.getAppContext();
      const normalizedConfig = api.getNormalizedConfig();
      const detectedLocales = detectLocalesDirectory(
        appDirectory,
        normalizedConfig,
      );

      if (backend) {
        const entryBackendOptions = getBackendOptions(
          entrypoint.entryName,
          backend,
        );
        // If user explicitly set enabled to false, don't auto-detect
        if (entryBackendOptions?.enabled === false) {
          backendOptions = entryBackendOptions;
        } else {
          if (detectedLocales) {
            backendOptions = applyDetectedBackendPaths(
              entryBackendOptions,
              detectedLocales,
            );
          } else if (
            entryBackendOptions?.loadPath ||
            entryBackendOptions?.addPath
          ) {
            // If user configured loadPath or addPath, auto-enable backend even
            // when no local locales directory is detected.
            backendOptions = {
              ...entryBackendOptions,
              enabled: true,
            };
          } else {
            backendOptions = entryBackendOptions;
          }
        }
      } else {
        // No backend config provided, try auto-detection
        if (detectedLocales) {
          // Auto-enable backend if locales directory is detected
          backendOptions = applyDetectedBackendPaths(
            getBackendOptions(entrypoint.entryName, {
              enabled: true,
            }),
            detectedLocales,
          );
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
