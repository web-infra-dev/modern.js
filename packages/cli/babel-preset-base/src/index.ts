import { createBabelChain } from '@modern-js/babel-chain';
import { getPresetChain } from './presets';
import { getPluginsChain } from './plugins';

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
    styledCompontentsOptions?: Record<string, any>;
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

export * from './type';
