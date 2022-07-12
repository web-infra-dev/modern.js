import type { TransformOptions } from '@babel/core';
import type { BabelConfig, BabelConfigUtils } from '@modern-js/core';
import { applyOptionsChain } from '@modern-js/utils';
import { createBabelChain } from './babel-chain';
import { getPresetChain } from './presets';
import { getPluginsChain } from './plugins';
import { IStyledComponentOptions } from './type';
import { getBabelUtils } from './babel-utils';

export * from './babel-chain';

export interface IBaseBabelConfigOption {
  appDirectory: string;
  presets?: {
    envOptions?: boolean | Record<string, any>;
    reactOptions?: boolean | Record<string, any>;
    typescriptOptions?: boolean | Record<string, any>;
  };
  plugins?: {
    transformRuntime?: any;
    import?: {
      antd?: {
        libraryDirectory: string;
      };
    };
    transformReactRemovePropTypes?: false | Record<string, any>;
    styledComponentsOptions?: IStyledComponentOptions;
    lodashOptions?: any;
  };
  useLegacyDecorators?: boolean;
  syntax?: 'es5' | 'es6+';
  type?: 'module' | 'commonjs';
  runEnvironments?: 'node' | 'browsers';
  jsxTransformRuntime?: 'automatic' | 'classic';
  useTsLoader?: boolean;
}

export const getBaseBabelChain = (option: IBaseBabelConfigOption) => {
  const chain = createBabelChain();
  const presetsChain = getPresetChain(option);
  const pluginsChain = getPluginsChain(option);
  chain.merge(presetsChain).merge(pluginsChain);
  return chain;
};

export const getBaseBabelConfig: any = (option: IBaseBabelConfigOption) =>
  getBaseBabelChain(option).toJSON();

export const applyUserBabelConfig = (
  defaultOptions: TransformOptions,
  userBabelConfig?: BabelConfig | BabelConfig[],
  extraBabelUtils?: Partial<BabelConfigUtils>,
) => {
  if (userBabelConfig) {
    const babelUtils = {
      ...getBabelUtils(defaultOptions),
      ...extraBabelUtils,
    } as BabelConfigUtils;

    return applyOptionsChain(defaultOptions, userBabelConfig || {}, babelUtils);
  }

  return defaultOptions;
};

export * from './type';
