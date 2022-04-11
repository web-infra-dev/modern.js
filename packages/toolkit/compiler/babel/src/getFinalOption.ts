import { glob, GlobOptions } from '@modern-js/utils';
import { DEFAULT_EXTENSIONS } from '@babel/core';
import {
  Extensions,
  ExtensionsFunc,
  ICompilerOptions,
  IFinaleCompilerOptions,
} from './type';
import { mergeDefaultOption } from './defaults';

export const getGlobPattern = (dir: string, extensions: Extensions) => {
  if (extensions.length > 1) {
    return `${dir}/**/*{${extensions.join(',')}}`;
  } else if (extensions.length === 1) {
    return `${dir}/**/*${extensions[0]}`;
  } else {
    return `${dir}/**/*`;
  }
};
export const getFinalExtensions = (
  extensions: Extensions | ExtensionsFunc | undefined,
) => {
  const isExtensions = (
    ext: Extensions | ExtensionsFunc | undefined,
  ): ext is Extensions => Array.isArray(ext);

  const isExtensionsFunc = (
    ext: Extensions | ExtensionsFunc | undefined,
  ): ext is ExtensionsFunc => typeof ext === 'function';

  if (isExtensions(extensions)) {
    return [...extensions, ...DEFAULT_EXTENSIONS];
  } else if (isExtensionsFunc(extensions)) {
    return extensions(DEFAULT_EXTENSIONS);
  } else {
    return DEFAULT_EXTENSIONS;
  }
};

export const getFilesFromDir = ({
  dir,
  finalExt = [],
  ignore = [],
}: {
  dir: string;
  finalExt?: string[];
  ignore?: GlobOptions['ignore'];
}) => {
  let globFindFilenames: string[] = [];
  const globPattern = getGlobPattern(dir, finalExt);

  globFindFilenames = glob.sync(globPattern, { ignore });

  return globFindFilenames;
};

export const getFinalCompilerOption = (
  option: ICompilerOptions,
): IFinaleCompilerOptions => {
  const optionWithDefault = mergeDefaultOption(option);
  const {
    sourceDir,
    ignore,
    enableWatch = false,
    watchDir,
    extensions = DEFAULT_EXTENSIONS,
  } = option;
  let globFindFilenames: string[] = [];

  const finalExt = getFinalExtensions(extensions);
  if (sourceDir) {
    globFindFilenames = getFilesFromDir({
      dir: sourceDir,
      ignore,
      finalExt,
    });
  }

  if (enableWatch) {
    // 开启watch模式，清空通过 sourceDir 找到的文件，而改为使用watchDirs
    globFindFilenames = getFilesFromDir({
      dir: watchDir as string,
      ignore,
      finalExt,
    });
  }

  return {
    ...optionWithDefault,
    filenames: [...optionWithDefault.filenames, ...globFindFilenames],
  };
};
