import {
  getBaseBabelChain,
  createBabelChain,
} from '@modern-js/babel-preset-base';
import { getPlugins } from './plugins';
import { ISyntaxOption, ILibPresetOption } from './types';

export * from '@modern-js/babel-preset-base';

export const getBabelConfig = (
  libPresetOption: ILibPresetOption,
  syntaxOption: ISyntaxOption,
) => getBabelChain(libPresetOption, syntaxOption).toJSON();

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
  const chain = createBabelChain();
  const baseChain = getBaseBabelChain({
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

  const plugins = getPlugins(libPresetOption);
  return chain.merge(baseChain).merge(plugins);
};

export * from './types';
export { applyUserBabelConfig } from '@modern-js/babel-preset-base';
