import { getBaseBabelChain } from '@modern-js/babel-preset-base';
import { ISyntaxOption, ILibPresetOption } from './types';
import { aliasPlugin } from './alias';

export const getBabelChain = (
  libPresetOption: ILibPresetOption,
  syntaxOption: ISyntaxOption,
) => {
  const {
    appDirectory,
    jsxTransformRuntime,
    enableReactPreset,
    enableTypescriptPreset,
    lodashOptions,
    styledComponentsOptions,
  } = libPresetOption;
  const { syntax, type } = syntaxOption;
  const chain = getBaseBabelChain({
    appDirectory,
    type,
    syntax,
    presets: {
      envOptions: true,
      reactOptions: enableReactPreset,
      typescriptOptions: enableTypescriptPreset
        ? { allowDeclareFields: true, allExtensions: true }
        : false,
    },
    plugins: {
      transformRuntime: {
        corejs: false, // 关闭 corejs
        // for es5 code need helper functions
        helpers: syntaxOption.syntax === 'es5',
      },
      lodashOptions,
      styledComponentsOptions,
    },
    jsxTransformRuntime,
  });

  if (libPresetOption.alias) {
    const [name, opt] = aliasPlugin(libPresetOption.alias);
    chain.plugin(name).use(require.resolve(name), [opt]);
  }

  return chain;
};

export * from './types';

export { applyUserBabelConfig } from '@modern-js/utils';
