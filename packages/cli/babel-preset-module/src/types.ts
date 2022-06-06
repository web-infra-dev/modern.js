import type { ILibPresetOption } from '@modern-js/babel-preset-lib';
import type { IImportPathOpts } from './built-in/import-path';

export type IModulePresetOption = ILibPresetOption & IImportPathOpts;
export type ImportStyleType = 'source-code' | 'compiled-code';
export type { ISyntaxOption } from '@modern-js/babel-preset-lib';
