import { createRuntimeExportsUtils, lazyImport } from '@modern-js/utils';
import type { CliPlugin, LegacyAppTools } from '@modern-js/app-tools';
import type { DesignSystem } from '../../types';

export const designTokenPlugin = (
  { pluginName } = { pluginName: '@modern-js/plugin-tailwindcss' },
): CliPlugin<LegacyAppTools> => ({
  name: '@modern-js/plugin-design-token',

  setup(api) {
    const resolveConfig = lazyImport('tailwindcss/resolveConfig', require);

    const PLUGIN_IDENTIFIER = 'designToken';

    const getDesignTokens = (designSystem?: DesignSystem) => {
      const tailwindcssConfig: Record<string, any> = {};

      tailwindcssConfig.theme = designSystem ? { ...designSystem } : {};

      // not use default design token when designToken.defaultTheme is false or theme is false
      if (!designSystem) {
        tailwindcssConfig.presets = [];
      }

      // when only designSystem exist, need remove supportStyledComponents
      if (designSystem) {
        delete tailwindcssConfig.theme.supportStyledComponents;
      }
      return resolveConfig(tailwindcssConfig).theme || {};
    };

    return {
      _internalRuntimePlugins({ entrypoint, plugins }) {
        const userConfig = api.useResolvedConfigContext();
        const designSystem = userConfig.source?.designSystem ?? {};
        let useSCThemeProvider = true;
        if (designSystem) {
          // when designSystem exist, designToken.styledComponents`s default value is false.
          useSCThemeProvider = designSystem?.supportStyledComponents || false;
        }
        if (
          typeof designSystem === 'object' &&
          designSystem.supportStyledComponents
        ) {
          const designTokens = getDesignTokens(userConfig.source.designSystem);
          plugins.push({
            name: PLUGIN_IDENTIFIER,
            path: `${pluginName}/runtime-design-token`,
            config: {
              token: designTokens,
              useStyledComponentsThemeProvider: Boolean(useSCThemeProvider),
              useDesignTokenContext: false,
            },
          });
        }
        return { entrypoint, plugins };
      },
      addRuntimeExports() {
        const appContext = api.useAppContext();

        const pluginsExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'plugins',
        );
        pluginsExportsUtils.addExport(
          `export { default as designToken } from '${pluginName}/runtime-design-token'`,
        );
      },
    };
  },
});
