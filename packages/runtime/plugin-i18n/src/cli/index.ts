import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import {
  type BackendOptions,
  type LocaleDetectionOptions,
  getAllBackendResourcePathPrefixes,
  getBackendOptionsForEntry,
  getLocaleDetectionOptions,
} from '../utils/config';

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

    api._internalServerPlugins(({ plugins }) => {
      const appDirectory = api.getAppContext()?.appDirectory;
      const resourcePathPrefixes = getAllBackendResourcePathPrefixes(
        backend,
        appDirectory,
      );
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
