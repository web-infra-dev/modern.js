import { getBaseBabelChain } from '@modern-js/babel-preset-base';
import { createBabelChain } from '@modern-js/babel-chain';
import { getPlugins } from './plugins';
import { ISyntaxOption, ILibPresetOption } from './types';

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
        ? { allowDeclareFields: true }
        : false,
    },
    plugins: {
      transformRuntime: {
        corejs: false, // 关闭 corejs
      },
      lodashOptions,
    },
    jsxTransformRuntime,
  });

  const plugins = getPlugins(libPresetOption);
  return chain.merge(baseChain).merge(plugins);
};

export * from './types';
export * from './babel-utils';
