import type { Rspack } from '@modern-js/builder';
import {
  fileReader,
  type FileReader,
} from '@modern-js/runtime-utils/fileReader';
import type { Middleware } from '@modern-js/server-core';
import type fs from '@modern-js/utils/fs-extra';

export const initFileReader = (
  compiler: Rspack.Compiler | Rspack.MultiCompiler | null,
  reader: FileReader = fileReader,
): Middleware => {
  let isInit = false;

  return async (ctx, next) => {
    if (isInit) {
      return next();
    }
    isInit = true;

    if (!compiler) {
      await reader.reset();
      return next();
    }

    // When dev.writeToDisk is configured as false,
    // the renderHandler needs to read the html file in memory through the fileReader
    const { outputFileSystem } =
      'compilers' in compiler ? compiler.compilers[0] : compiler;
    if (outputFileSystem) {
      await reader.reset(outputFileSystem as unknown as typeof fs);
    } else {
      await reader.reset();
    }
    return next();
  };
};
