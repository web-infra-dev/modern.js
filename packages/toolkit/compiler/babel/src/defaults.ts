import { ICompilerOptions, ICompilerOptionsWithDefault } from './type';
import { defaultDistFileExtMap } from './constants';

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
