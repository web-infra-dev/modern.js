import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { getPublicDirRoutePrefixes } from '@modern-js/server-core';
import type { LocaleDetectionOptions } from '../shared/type';
import { getLocaleDetectionOptions } from '../shared/utils';

export interface I18nPluginOptions {
  localeDetection?: LocaleDetectionOptions;
  backend?: BackendOptions;
}

export const i18nPlugin = (
  options: I18nPluginOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-i18n',
  setup: api => {
    const { localeDetection, backend } = options;
    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const localeDetectionOptions = localeDetection
        ? getLocaleDetectionOptions(entrypoint.entryName, localeDetection)
        : undefined;
      const backendOptions = backend
        ? getBackendOptions(entrypoint.entryName, backend)
        : undefined;
      plugins.push({
        name: 'i18n',
        path: '@modern-js/plugin-i18n/runtime',
        config: {
          entryName: entrypoint.entryName,
          localeDetection: localeDetectionOptions,
          backend: backendOptions,
        },
      });
      return {
        entrypoint,
        plugins,
      };
    });

    api._internalServerPlugins(({ plugins }) => {
      const { serverRoutes } = api.getAppContext();
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
        name: '@modern-js/plugin-i18n/server',
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
