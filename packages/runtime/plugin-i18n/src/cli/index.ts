import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import type { LocaleDetectionOptions } from '../shared/type';
import { getLocaleDetectionOptions } from '../shared/utils';

export interface I18nPluginOptions {
  localeDetection?: LocaleDetectionOptions;
}

export const i18nPlugin = (
  options: I18nPluginOptions = {},
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-i18n',
  setup: api => {
    const { localeDetection } = options;
    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const localeDetectionOptions = localeDetection
        ? getLocaleDetectionOptions(entrypoint.entryName, localeDetection)
        : undefined;
      plugins.push({
        name: 'i18n',
        path: '@modern-js/plugin-i18n/runtime',
        config: {
          entryName: entrypoint.entryName,
          localeDetection: localeDetectionOptions,
        },
      });
      return {
        entrypoint,
        plugins,
      };
    });

    api._internalServerPlugins(({ plugins }) => {
      plugins.push({
        name: '@modern-js/plugin-i18n/server',
        options: {
          localeDetection,
        },
      });
      return { plugins };
    });
  },
});

export default i18nPlugin;
