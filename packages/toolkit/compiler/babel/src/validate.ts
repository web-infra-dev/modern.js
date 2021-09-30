import { logger } from '@modern-js/utils';
import { ICompilerOptions, ICompilerResult } from './type';

export const sourceDirAndFileNamesValidMessage =
  'At least one of the sourceDir and filenames configurations must be configured';
export const watchDirValidMessage =
  'should set watchDir when enableWatch is true';

export const validateSourceDirAndFileNames = (
  compilerOptions: ICompilerOptions,
): ICompilerResult | null => {
  const { sourceDir, filenames, quiet } = compilerOptions;
  if (!sourceDir && !filenames) {
    if (!quiet) {
      logger.error(sourceDirAndFileNamesValidMessage);
    }
    return {
      code: 1,
      message: sourceDirAndFileNamesValidMessage,
      virtualDists: [],
    };
  }

  return null;
};

export const validateWatchDir = (
  compilerOptions: ICompilerOptions,
): ICompilerResult | null => {
  const { watchDir, enableWatch, quiet } = compilerOptions;
  if (enableWatch && !watchDir) {
    if (!quiet) {
      logger.error(watchDirValidMessage);
    }
    return { code: 1, message: watchDirValidMessage, virtualDists: [] };
  }

  return null;
};

export const validate = (compilerOptions: ICompilerOptions) => {
  if (compilerOptions.enableWatch) {
    return validateWatchDir(compilerOptions);
  }

  return validateSourceDirAndFileNames(compilerOptions);
};
