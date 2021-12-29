/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable max-lines */
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

const PLUGIN_IDENTIFIER = 'designToken';

const getDesignTokens = (userConfig: NormalizedConfig) => {
  const {
    source: {
      designSystem,
      theme = false,
      designToken = {
        defaultTheme: true,
      },
    },
  } = userConfig as NormalizedConfig & {
    source: {
      designSystem: Record<string, any>;
      designToken?: {
        defaultTheme?: boolean;
        tailwindcss?: boolean;
      };
      theme?: boolean | Record<string, any>;
    };
  }; // TODO: Type to be filled

  const tailwindcssConfig: Record<string, any> = {};

  if (isFalseValue(theme)) {
    // theme is false
    tailwindcssConfig.theme = { ...designSystem } || {};
  } else if (isObject(theme)) {
    // empty object or unemptyobject that have something
    tailwindcssConfig.theme = theme;
  } else {
    // theme is true
    tailwindcssConfig.theme = {};
  }

  // not use default design token when designToken.defaultTheme is false or theme is false
  if (isFalseValue(designToken.defaultTheme)) {
    tailwindcssConfig.presets = [];
  } else if (!designSystem && !theme) {
    tailwindcssConfig.presets = [];
  }

  // when only designSystem exist, need remove supportStyledComponents
  if (!theme && designSystem) {
    delete tailwindcssConfig.theme.supportStyledComponents;
  }
  return resolveConfig(tailwindcssConfig).theme || {};
};

const isObject = (o: any) => typeof o === 'object' && o !== null;

const isBoolean = (b: any) => typeof b === 'boolean';
const isFalseValue = (f: any) => isBoolean(f) && !f;

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
    `在解析 Design Token 过程中，出现无法识别的值: ${key}.${value}. 允许解析的值为对象、数组、字符串类型`,
  );
  // eslint-disable-next-line no-process-exit
  process.exit(1);
};

const getCssVars = (designTokens: Record<string, any>) => {
  const keys = Object.keys(designTokens);

  let cssVarsArray: { key: string; value: string }[] = [];
  for (const key of keys) {
    cssVarsArray = [...cssVarsArray, ...getVars(key, designTokens[key])];
  }

  return cssVarsArray;
};
// transfrom rules:
// - '.' => '-point-'
// - '+' => '-addition-'
// - '*' => '-multiplication-'
// - '%' => '-remainder-'
// - ',' => '-comma-'
// - '\' => '-division-'
const formatVarsKey = (key: string, prefix = '') =>
  prefix +
  key
    .replace(/\s+/, '')
    .replace(/\.$/g, '-point')
    .replace(/\./g, '-point-')
    .replace(/\+$/g, '-addition')
    .replace(/\+/g, '-addition-')
    .replace(/\*$/g, '-multiplication')
    .replace(/\*/g, '-multiplication-')
    .replace(/%$/g, '-remainder')
    .replace(/%/g, '-remainder-')
    .replace(/,$/g, '-comma')
    .replace(/,/g, '-comma-')
    .replace(/\/$/g, '-backslash')
    .replace(/\//g, '-backslash-');
const defaultPrefix = 'theme-';
const getPrefix = (p: string | undefined) =>
  p === undefined ? defaultPrefix : p;

const index = createPlugin(
  (() => {
    let pluginsExportsUtils: any;
    const designTokenModulePath = path.resolve(__dirname, '../../../../');

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
              const userConfig =
                // eslint-disable-next-line react-hooks/rules-of-hooks
                useResolvedConfigContext() as NormalizedConfig & {
                  source: {
                    designSystem: Record<string, any>;
                    designToken?: {
                      less?: boolean;
                      prefix?: string;
                    };
                  };
                };
              const {
                source: {
                  designSystem,
                  designToken = designSystem
                    ? {}
                    : {
                        less: true,
                      },
                },
              } = userConfig;
              if (isFalseValue(designToken.less)) {
                return opt;
              }

              if (designSystem && !designToken.less) {
                return opt;
              }

              const theme = getDesignTokens(userConfig);
              const cssVars = getCssVars(theme);
              const globalVars = cssVars.reduce(
                (cssVarObj, cssVar) => ({
                  ...cssVarObj,
                  [`@${formatVarsKey(
                    cssVar.key,
                    getPrefix(designToken.prefix),
                  )}`]: cssVar.value,
                }),
                {},
              );
              const globalVarsFilePath = path.join(
                appContext.internalDirectory,
                './global-var.less',
              );
              const injectLessVars = cssVars.reduce(
                (str, cssVar) =>
                  `${str}\n@${formatVarsKey(
                    cssVar.key,
                    getPrefix(designToken.prefix),
                  )}: ${cssVar.value};`,
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
              const userConfig =
                // eslint-disable-next-line react-hooks/rules-of-hooks
                useResolvedConfigContext() as NormalizedConfig & {
                  source: {
                    designSystem: Record<string, any>;
                    designToken?: {
                      sass?: boolean;
                      prefix?: string;
                    };
                  };
                };
              const {
                source: {
                  designSystem,
                  designToken = designSystem
                    ? {}
                    : {
                        sass: true,
                      },
                },
              } = userConfig;
              if (isFalseValue(designToken.sass)) {
                return opt;
              }

              if (designSystem && !designToken.sass) {
                return opt;
              }

              const theme = getDesignTokens(userConfig);
              const cssVars = getCssVars(theme);
              const injectScssVars = cssVars.reduce(
                (str, cssVar) =>
                  `${str}\n$${formatVarsKey(
                    cssVar.key,
                    getPrefix(designToken.prefix),
                  )}: ${cssVar.value};`,
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
            postcss: (opt: Record<string, any>) => {
              const userConfig =
                // eslint-disable-next-line react-hooks/rules-of-hooks
                useResolvedConfigContext() as NormalizedConfig & {
                  source: {
                    designSystem: Record<string, any>;
                    designToken?: {
                      css?: boolean;
                      prefix?: string;
                    };
                  };
                };
              const {
                source: {
                  designSystem,
                  designToken = designSystem
                    ? {}
                    : {
                        css: true,
                      },
                },
              } = userConfig;
              if (isFalseValue(designToken.css)) {
                return opt;
              }

              if (designSystem && !designToken.css) {
                return opt;
              }

              const theme = getDesignTokens(userConfig);
              const cssVars = getCssVars(theme);
              const cssVarsHash = cssVars.reduce(
                (obj, cssVar) => ({
                  ...obj,
                  [`--${formatVarsKey(
                    cssVar.key,
                    getPrefix(designToken.prefix),
                  )}`]: cssVar.value,
                }),
                {},
              );
              opt.postcssOptions.plugins.push(
                require('../postcss-plugin').default({ cssVarsHash }),
              );

              return opt;
            },
          },
        };
      },
      modifyEntryImports({ entrypoint, imports }: any) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const userConfig = useResolvedConfigContext() as NormalizedConfig & {
          source: {
            designToken?: {
              js?: boolean;
              styledComponents?: boolean;
            };
          };
        };
        const {
          source: {
            designToken = {
              js: true,
              styledComponents: true,
            },
          },
        } = userConfig;
        const skipModifyEntryImports =
          isFalseValue(designToken.js) &&
          isFalseValue(designToken.styledComponents);
        if (!skipModifyEntryImports) {
          const designTokens = getDesignTokens(userConfig);
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
          source: {
            designSystem,
            designToken = designSystem
              ? {}
              : {
                  js: true,
                  styledComponents: true,
                },
          },
          // eslint-disable-next-line react-hooks/rules-of-hooks
        } = useResolvedConfigContext() as NormalizedConfig & {
          source: {
            designSystem?: {
              supportStyledComponents?: boolean;
            };
            designToken?: {
              js?: boolean;
              styledComponents?: boolean;
            };
          };
        };
        let useSCThemeProvider = true;
        if (isFalseValue(designToken.styledComponents)) {
          useSCThemeProvider = false;
        } else if (designSystem) {
          // when designSystem exist, designToken.styledComponents`s default value is false.
          useSCThemeProvider =
            designToken.styledComponents ||
            designSystem?.supportStyledComponents ||
            false;
        }

        let useDesignTokenContext = true;
        if (isFalseValue(designToken.js)) {
          useDesignTokenContext = false;
        } else if (designSystem) {
          // when designSystem exist, designToken.js default value is false.
          useDesignTokenContext = designToken.js || false;
        }
        const useDesignToken = !(
          isFalseValue(designToken.js) &&
          isFalseValue(designToken.styledComponents)
        );
        if (useDesignToken) {
          plugins.push({
            name: PLUGIN_IDENTIFIER,
            options: `{token: designTokens, useStyledComponentsThemeProvider: ${
              useSCThemeProvider ? 'true' : 'false'
            }, useDesignTokenContext: ${
              useDesignTokenContext ? 'true' : 'false'
            }}`,
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
        const userConfig = useResolvedConfigContext() as NormalizedConfig & {
          source: {
            designSystem?: Record<string, any>;
            designToken?: {
              js?: boolean;
            };
          };
        };
        const {
          source: {
            designSystem,
            designToken = designSystem ? {} : { js: true },
          },
        } = userConfig;
        if (!isFalseValue(designToken?.js)) {
          const designTokens = getDesignTokens(userConfig);
          const { addTypes } = createDefineTypesUtils(
            appContext.internalDirectory,
          );
          addTypes(`
          declare type IDesignTokens = ${JSON.stringify(designTokens)};
        `);
        }
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
  }) as any,
  {
    name: '@modern-js/plugin-design-token',
    required: ['@modern-js/runtime'],
  },
);

export default index;
/* eslint-enable max-lines */
/* eslint-enable @typescript-eslint/no-var-requires */
/* eslint-enable @typescript-eslint/no-require-imports */
