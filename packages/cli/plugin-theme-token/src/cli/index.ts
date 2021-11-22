import path from 'path';
import {
  createRuntimeExportsUtils,
  createDefineTypesUtils,
  PLUGIN_SCHEMAS,
  lazyImport,
} from '@modern-js/utils';
import {
  createPlugin,
  NormalizedConfig,
  useAppContext,
  useResolvedConfigContext,
} from '@modern-js/core';

const resolveConfig = lazyImport('tailwindcss/resolveConfig', require);

const PLUGIN_IDENTIFIER = 'themeToken';

const getThemeTokens = (userConfig: NormalizedConfig) => {
  const {
    tools: { tailwindcss = {} },
    source: { designSystem = {} },
  } = userConfig as NormalizedConfig & {
    tools: {
      tailwindcss: Record<string, any>;
    };
    source: {
      designSystem: Record<string, any>;
    };
  }; // TODO: 类型待补齐
  const tailwindcssConfig = {
    ...tailwindcss,
    theme: { ...designSystem },
  };
  delete tailwindcssConfig.theme.supportStyledComponents;
  const { theme = {} } = resolveConfig(tailwindcssConfig);
  return theme;
};

const index = createPlugin(
  (() => {
    let pluginsExportsUtils: any;
    const themeTokenModulePath = path.resolve(__dirname, '../../../../');

    return {
      config() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const appContext = useAppContext();

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
        };
      },
      modifyEntryImports({ entrypoint, imports }: any) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const userConfig = useResolvedConfigContext();
        const theme = getThemeTokens(userConfig);
        imports.push({
          value: '@modern-js/runtime/plugins',
          specifiers: [
            {
              imported: PLUGIN_IDENTIFIER,
            },
          ],
        });
        imports.push({
          value: '@modern-js/runtime/theme',
          specifiers: [{ imported: 'theme' }],
          initialize: `
const themeTokens = ${JSON.stringify(theme)};
          `,
        });

        return {
          entrypoint,
          imports,
        };
      },

      modifyEntryRuntimePlugins({ entrypoint, plugins }: any) {
        const {
          source: { designSystem = {} },
          // eslint-disable-next-line react-hooks/rules-of-hooks
        } = useResolvedConfigContext() as NormalizedConfig & {
          source: {
            designSystem?: {
              supportStyledComponents?: boolean;
            };
          };
        };
        const useSCThemeProvider =
          designSystem?.supportStyledComponents || false;
        plugins.push({
          name: PLUGIN_IDENTIFIER,
          options: `{token: themeTokens, useStyledComponentsThemeProvider: ${
            useSCThemeProvider ? 'true' : 'false'
          }}`,
        });
        return {
          entrypoint,
          plugins,
        };
      },
      addDefineTypes() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const appContext = useAppContext();
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const userConfig = useResolvedConfigContext();
        const theme = getThemeTokens(userConfig);
        const { addTypes } = createDefineTypesUtils(
          appContext.internalDirectory,
        );
        addTypes(`
          declare type ITokens = ${JSON.stringify(theme)};
        `);
      },
      validateSchema() {
        // add source.designSystem.supportStyledComponents config
        return PLUGIN_SCHEMAS['@modern-js/plugin-theme-token'];
      },
      addRuntimeExports() {
        pluginsExportsUtils.addExport(
          `export { default as themeToken } from '${themeTokenModulePath}'`,
        );
      },
    };
  }) as any,
  {
    name: '@modern-js/plugin-theme-token',
    required: ['@modern-js/runtime'],
  },
);

export default index;
