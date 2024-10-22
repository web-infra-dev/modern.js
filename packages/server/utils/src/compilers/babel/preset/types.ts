export interface AliasOption {
  absoluteBaseUrl: string;
  paths?: Record<string, string | string[]>;
  isTsPath?: boolean;
  isTsProject?: boolean;
}

export interface ILibPresetOption {
  appDirectory: string;
  alias?: AliasOption;
  isEsm?: boolean;
}

export type JsxTransformRuntimeType = 'automatic' | 'classic';
