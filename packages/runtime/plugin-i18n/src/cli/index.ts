import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import type { BackendOptions, LocaleDetectionOptions } from '../shared/type';
import { getLocaleDetectionOptions } from '../shared/utils';
import {
  getAllBackendResourcePathPrefixes,
  getBackendOptionsForEntry,
} from './utils/config';
import { collectLocaleRoutes } from './utils/routes';

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

      const appDirectory = api.getAppContext()?.appDirectory;
      const backendOptions = getBackendOptionsForEntry(
        entrypoint.entryName,
        backend,
        appDirectory,
      );

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

    api.config(() => {
      const { appDirectory } = api.getAppContext();
      const resourcePathPrefixes = getAllBackendResourcePathPrefixes(
        backend,
        appDirectory,
      );
      return {
        output: {
          copy: resourcePathPrefixes.map(prefix => ({
            from: prefix.replace(/^\//, ''),
            to: prefix.replace(/^\//, ''),
          })),
        },
      };
    });

    api.modifyServerRoutes(({ routes }) => {
      const { appDirectory } = api.getAppContext();
      if (!appDirectory) {
        return { routes };
      }

      // Get all locales directory paths
      const urlPrefixes = getAllBackendResourcePathPrefixes(
        backend,
        appDirectory,
      );

      // Collect locale routes from backend directories
      const localeRoutes = collectLocaleRoutes(
        urlPrefixes,
        appDirectory,
        backend,
      );

      return { routes: [...routes, ...localeRoutes] };
    });

    api._internalServerPlugins(({ plugins }) => {
      const { appDirectory, serverRoutes } = api.getAppContext();

      const resourcePathPrefixes = getAllBackendResourcePathPrefixes(
        backend,
        appDirectory,
      );

      if (serverRoutes && Array.isArray(serverRoutes)) {
        // Get static route prefixes from both 'public' and 'locales' directories
        // 'public' routes are handled by static plugin, 'locales' routes are handled by i18n plugin
        const staticRoutePrefixes = serverRoutes
          .filter(
            route =>
              !route.entryName &&
              (route.entryPath.startsWith('public') ||
                route.entryPath.startsWith('locales')),
          )
          .map(route => route.urlPath)
          .filter(Boolean);
        resourcePathPrefixes.push(...staticRoutePrefixes);
      }

      plugins.push({
        name: '@modern-js/plugin-i18n/server',
        options: {
          localeDetection,
          resourcePathPrefixes,
        },
      });
      return { plugins };
    });
  },
});

export default i18nPlugin;
