import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { getPublicDirRoutePrefixes } from '@modern-js/server-core';
import type { Entrypoint } from '@modern-js/types';
import type { BackendOptions, LocaleDetectionOptions } from '../shared/type';
import { getBackendOptions, getLocaleDetectionOptions } from '../shared/utils';

export type TransformRuntimeConfigFn = (
  extendedConfig: Record<string, any>,
  entrypoint: Entrypoint,
) => Record<string, any>;

export interface I18nPluginOptions {
  localeDetection?: LocaleDetectionOptions;
  backend?: BackendOptions;
  transformRuntimeConfig?: TransformRuntimeConfigFn;
  [key: string]: any;
}

export const i18nPlugin = (
  options: I18nPluginOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-i18n',
  setup: api => {
    const { localeDetection, backend, transformRuntimeConfig, ...restOptions } =
      options;
    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const localeDetectionOptions = localeDetection
        ? getLocaleDetectionOptions(entrypoint.entryName, localeDetection)
        : undefined;
      const backendOptions = backend
        ? getBackendOptions(entrypoint.entryName, backend)
        : undefined;
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
        name: 'i18n',
        path: `@${metaName}/plugin-i18n/runtime`,
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
        name: `@${metaName}/plugin-i18n/server`,
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
