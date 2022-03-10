import type { IStyledComponentOptions } from '@modern-js/babel-preset-base';

export interface ISyntaxOption {
  syntax: 'es5' | 'es6+';
  type: 'module' | 'commonjs';
}

export interface AliasOption {
  absoluteBaseUrl: string;
  paths?: Record<string, string | string[]>;
  isTsPath?: boolean;
  isTsProject?: boolean;
}

export interface ILibPresetOption {
  appDirectory: string;
  enableTypescriptPreset?: boolean;
  enableReactPreset?: boolean;
  lodashOptions?: any;
  alias?: AliasOption;
  envVars?: string[];
  globalVars?: Record<string, string>;
  jsxTransformRuntime?: JsxTransformRuntimeType;
  styledComponentsOptions?: IStyledComponentOptions;
}

export type JsxTransformRuntimeType = 'automatic' | 'classic';
