import * as path from 'path';
import {
  createRuntimeExportsUtils,
  createDefineTypesUtils,
  PLUGIN_SCHEMAS,
  lazyImport,
  fs,
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
  }; // TODO: Type to be filled

  const tailwindcssConfig = {
    ...tailwindcss,
    theme: { ...designSystem },
  };
  delete tailwindcssConfig.theme.supportStyledComponents;
  delete tailwindcssConfig.theme.experimental;
  const { theme = {} } = resolveConfig(tailwindcssConfig);
  return theme;
};

const isObject = (o: any) => typeof o === 'object' && o !== null;

interface IVars {
  key: string;
  value: string;
}

// eslint-disable-next-line consistent-return
const getVars = (key: string, value: any): IVars[] => {
  if (typeof value === 'string') {
    return [{ key, value }];
  } else if (Array.isArray(value)) {
    return value.reduce(
      (allVars, v, index) => [...allVars, ...getVars(`${key}-${index}`, v)],
      [],
    );
  } else if (isObject(value)) {
    const nestKeys = Object.keys(value);
    return nestKeys.reduce<IVars[]>(
      (allVars, nestKey) => [
        ...allVars,
        ...getVars(`${key}-${nestKey}`, value[nestKey]),
      ],
      [],
    );
  }

  console.error(
    `在解析 Theme Token 过程中，出现无法识别的值: ${key}.${value}. 可以解析的值为对象、数组、字符串`,
  );
  // eslint-disable-next-line no-process-exit
  process.exit(1);
};

const getCssVars = (theme: Record<string, any>) => {
  const keys = Object.keys(theme);

  let cssVarsArray: { key: string; value: string }[] = [];
  for (const key of keys) {
    cssVarsArray = [...cssVarsArray, ...getVars(key, theme[key])];
  }

  return cssVarsArray;
};
// transfrom rules:
// . => point
// + => -
// * => --
// % => ---
// , => _
// \ => __
const formatVarsKey = (key: string) =>
  key
    .replace(/\s+/, '')
    .replace(/\./g, 'point')
    .replace(/\+/g, '-')
    .replace(/\*/g, '--')
    .replace(/%/g, '---')
    .replace(/,/g, '_')
    .replace(/\//g, '__');

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
          tools: {
            less: (opt: Record<string, any>) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const userConfig = useResolvedConfigContext();
              const enableFeature =
                userConfig.runtime.themeToken &&
                (userConfig.source as any)?.designSystem?.experimental
                  ?.enableLessVars;
              if (!enableFeature) {
                return opt;
              }
              const theme = getThemeTokens(userConfig);
              const cssVars = getCssVars(theme);
              const globalVars = cssVars.reduce(
                (cssVarObj, cssVar) => ({
                  ...cssVarObj,
                  [`@${formatVarsKey(cssVar.key)}`]: cssVar.value,
                }),
                {},
              );
              const globalVarsFilePath = path.join(
                appContext.internalDirectory,
                './global-var.less',
              );
              const injectLessVars = cssVars.reduce(
                (str, cssVar) =>
                  `${str}\n@${formatVarsKey(cssVar.key)}: ${cssVar.value};`,
                '',
              );
              fs.ensureFileSync(globalVarsFilePath);
              fs.writeFileSync(globalVarsFilePath, injectLessVars);
              return {
                ...opt,
                lessOptions: {
                  globalVars,
                },
              };
            },
            sass: (opt: Record<string, any>) => {
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const userConfig = useResolvedConfigContext();
              const enableFeature =
                userConfig.runtime.themeToken &&
                (userConfig.source as any)?.designSystem?.experimental
                  ?.enableSassVars;
              if (!enableFeature) {
                return opt;
              }
              const theme = getThemeTokens(userConfig);
              const cssVars = getCssVars(theme);
              const injectScssVars = cssVars.reduce(
                (str, cssVar) =>
                  `${str}\n$${formatVarsKey(cssVar.key)}: ${cssVar.value};`,
                '',
              );

              const globalVarsFilePath = path.join(
                appContext.internalDirectory,
                './global-var.scss',
              );
              fs.ensureFileSync(globalVarsFilePath);
              fs.writeFileSync(globalVarsFilePath, injectScssVars);
              return {
                ...opt,
                additionalData: `@import '${globalVarsFilePath}';`,
              };
            },
          },
        };
      },
      modifyEntryImports({ entrypoint, imports }: any) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const userConfig = useResolvedConfigContext();
        if (userConfig?.runtime?.themeToken) {
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
        }

        return {
          entrypoint,
          imports,
        };
      },

      modifyEntryRuntimePlugins({ entrypoint, plugins }: any) {
        const {
          source: { designSystem = {} },
          runtime: { themeToken = false },
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
        if (themeToken) {
          plugins.push({
            name: PLUGIN_IDENTIFIER,
            options: `{token: themeTokens, useStyledComponentsThemeProvider: ${
              useSCThemeProvider ? 'true' : 'false'
            }, runtimeThemeToken: ${themeToken ? 'true' : 'false'}}`,
          });
        }
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
        if (userConfig?.runtime?.themeToken) {
          const theme = getThemeTokens(userConfig);
          const { addTypes } = createDefineTypesUtils(
            appContext.internalDirectory,
          );
          addTypes(`
          declare type IThemeTokens = ${JSON.stringify(theme)};
        `);
        }
      },
      validateSchema() {
        // add source.designSystem.supportStyledComponents config
        return PLUGIN_SCHEMAS['@modern-js/plugin-theme-token'];
      },
      addRuntimeExports() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const userConfig = useResolvedConfigContext();
        if (userConfig?.runtime?.themeToken) {
          pluginsExportsUtils.addExport(
            `export { default as themeToken } from '${themeTokenModulePath}'`,
          );
        }
      },
    };
  }) as any,
  {
    name: '@modern-js/plugin-theme-token',
    required: ['@modern-js/runtime'],
  },
);

export default index;
