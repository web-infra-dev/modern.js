import { defaultDistFileExtMap } from './constants';
import type { ICompilerOptions, ICompilerOptionsWithDefault } from './type';

const defaultOptions = {
  enableWatch: false,
  enableVirtualDist: false,
  extensions: [],
  filenames: [],
  distFileExtMap: defaultDistFileExtMap,
  ignore: [],
  quiet: false,
  verbose: false,
  clean: false,
};

export const mergeDefaultOption = (
  compilerOptions: ICompilerOptions,
): ICompilerOptionsWithDefault => ({
  ...defaultOptions,
  ...compilerOptions,
});
