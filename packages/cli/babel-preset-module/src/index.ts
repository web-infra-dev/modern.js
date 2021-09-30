import { getBabelChain } from '@modern-js/babel-preset-lib';
import type { TransformOptions } from '@babel/core';
import type { BabelChain } from '@modern-js/babel-chain';
import type { IModulePresetOption, ISyntaxOption } from './types';
import { getBuildInPlugins } from './built-in';

export const getBabelConfig = (
  modulePresetOption: IModulePresetOption,
  syntaxOption: ISyntaxOption,
): TransformOptions => {
  const chain = getModuleBabelChain(modulePresetOption, syntaxOption);

  return {
    sourceType: 'unambiguous',
    ...chain.toJSON(),
  };
};

export const getModuleBabelChain = (
  modulePresetOption: IModulePresetOption,
  syntaxOption: ISyntaxOption,
): BabelChain => {
  const { appDirectory } = modulePresetOption;
  const chain = getBabelChain(modulePresetOption, syntaxOption);

  // link: https://github.com/tc39/proposal-do-expressions
  chain
    .plugin('@babel/plugin-proposal-do-expressions')
    .use(require.resolve('@babel/plugin-proposal-do-expressions'));

  // link: https://github.com/tc39/proposal-throw-expressions
  chain
    .plugin('@babel/plugin-proposal-throw-expressions')
    .use(require.resolve('@babel/plugin-proposal-throw-expressions'));

  // https://github.com/tc39/proposal-class-static-block
  chain
    .plugin('@babel/plugin-proposal-class-static-block')
    .use(require.resolve('@babel/plugin-proposal-class-static-block'));

  // link:
  // https://github.com/tc39/proposal-function.sent
  chain
    .plugin('@babel/plugin-proposal-function-sent')
    .use(require.resolve('@babel/plugin-proposal-function-sent'));

  // link:
  // https://github.com/tc39/proposal-logical-assignment
  chain
    .plugin('@babel/plugin-proposal-logical-assignment-operators')
    .use(
      require.resolve('@babel/plugin-proposal-logical-assignment-operators'),
    );

  const buildInPlugins = getBuildInPlugins({
    appDirectory,
    importStyle: modulePresetOption.importStyle,
  });
  chain.merge(buildInPlugins);

  return chain;
};

export const getFinalBabelConfig = (chain: BabelChain): TransformOptions => ({
  sourceType: 'unambiguous',
  ...chain.toJSON(),
});

export * from './types';
export { getBabelUtils } from '@modern-js/babel-preset-lib';
