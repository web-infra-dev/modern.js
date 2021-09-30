import type { ILibPresetOption } from '@modern-js/babel-preset-lib';

export interface IModulePresetOption extends ILibPresetOption {
  importStyle?: ImportStyleType;
}
export type ImportStyleType = 'source-code' | 'compiled-code';
export type { ISyntaxOption } from '@modern-js/babel-preset-lib';
