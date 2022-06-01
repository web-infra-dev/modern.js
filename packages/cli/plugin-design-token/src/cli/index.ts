import * as path from 'path';
import {
  lazyImport,
  PLUGIN_SCHEMAS,
  createRuntimeExportsUtils,
} from '@modern-js/utils';
import type { CliPlugin, NormalizedConfig } from '@modern-js/core';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-design-token',

  setup(api) {
    let pluginsExportsUtils: any;
    const designTokenModulePath = path.resolve(__dirname, '../../../../');

    const resolveConfig = lazyImport('tailwindcss/resolveConfig', require);

    const PLUGIN_IDENTIFIER = 'designToken';

    const getDesignTokens = (userConfig: NormalizedConfig) => {
      const {
        source: { designSystem },
      } = userConfig as NormalizedConfig & {
        source: {
          designSystem: Record<string, any>;
        };
      }; // TODO: Type to be filled

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
      config() {
        const appContext = api.useAppContext();

        pluginsExportsUtils = createRuntimeExportsUtils(
          appContext.internalDirectory,
          'plugins',
        );

        return {
          source: {
            alias: {
              '@modern-js/runtime/plugins': pluginsExportsUtils.getPath(),
            },
          },
          tools: {
            // TODO: support less、scss、css vars
            // less: https://github.com/modern-js-dev/modern.js/pull/398/files#diff-f77c749e403fbf1fb676d5687bef3d7138a230331c849298d8afaff9b6afbc3dR166
            // sass: https://github.com/modern-js-dev/modern.js/pull/398/files#diff-f77c749e403fbf1fb676d5687bef3d7138a230331c849298d8afaff9b6afbc3dR229
            // postcss: https://github.com/modern-js-dev/modern.js/pull/398/files#diff-f77c749e403fbf1fb676d5687bef3d7138a230331c849298d8afaff9b6afbc3dR281
          },
        };
      },

      modifyEntryImports({ entrypoint, imports }: any) {
        const userConfig =
          api.useResolvedConfigContext() as NormalizedConfig & {
            source: {
              designSystem?: {
                supportStyledComponents?: boolean;
              };
            };
          };
        const {
          source: { designSystem },
        } = userConfig;
        if (
          typeof designSystem === 'object' &&
          designSystem.supportStyledComponents
        ) {
          const designTokens = getDesignTokens(userConfig);
          imports.push({
            value: '@modern-js/runtime/plugins',
            specifiers: [
              {
                imported: PLUGIN_IDENTIFIER,
              },
            ],
            initialize: `
  const designTokens = ${JSON.stringify(designTokens)};
            `,
          });
        }

        return {
          entrypoint,
          imports,
        };
      },

      modifyEntryRuntimePlugins({ entrypoint, plugins }: any) {
        const {
          source: { designSystem },
        } = api.useResolvedConfigContext() as NormalizedConfig & {
          source: {
            designSystem?: {
              supportStyledComponents?: boolean;
            };
          };
        };
        let useSCThemeProvider = true;
        if (designSystem) {
          // when designSystem exist, designToken.styledComponents`s default value is false.
          useSCThemeProvider = designSystem?.supportStyledComponents || false;
        }

        if (
          typeof designSystem === 'object' &&
          designSystem.supportStyledComponents
        ) {
          plugins.push({
            name: PLUGIN_IDENTIFIER,
            options: `{token: designTokens, useStyledComponentsThemeProvider: ${
              useSCThemeProvider ? 'true' : 'false'
            }, useDesignTokenContext: false}`,
          });
        }
        return {
          entrypoint,
          plugins,
        };
      },

      validateSchema() {
        // add source.designSystem.supportStyledComponents config
        return PLUGIN_SCHEMAS['@modern-js/plugin-design-token'];
      },

      addRuntimeExports() {
        pluginsExportsUtils.addExport(
          `export { default as designToken } from '${designTokenModulePath}'`,
        );
      },
    };
  },
});
