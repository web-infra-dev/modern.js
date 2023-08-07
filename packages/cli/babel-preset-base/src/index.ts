import { createBabelChain } from './babel-chain';
import { getPresetChain } from './presets';
import { getPluginsChain } from './plugins';
import { IStyledComponentOptions } from './type';

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
      antd?:
        | {
            libraryDirectory: string;
          }
        | false;
    };
    styledComponentsOptions?: false | IStyledComponentOptions;
  };
  useLegacyDecorators?: boolean;
  syntax?: 'es5' | 'es6+';
  type?: 'module' | 'commonjs';
  runEnvironments?: 'node' | 'browsers';
  jsxTransformRuntime?: 'automatic' | 'classic';
  useTsLoader?: boolean;
  overrideBrowserslist?: string[];
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
