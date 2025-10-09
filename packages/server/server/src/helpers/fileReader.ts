import { fileReader } from '@modern-js/runtime-utils/fileReader';
import type { Middleware } from '@modern-js/server-core';
import type { Rspack } from '@modern-js/builder';
import type fs from '@modern-js/utils/fs-extra';

export const initFileReader = (
  compiler: Rspack.Compiler | Rspack.MultiCompiler | null,
): Middleware => {
  let isInit = false;

  return async (ctx, next) => {
    if (isInit) {
      return next();
    }
    isInit = true;

    const { res } = ctx.env.node;
    if (!compiler) {
      fileReader.reset();
      return next();
    }

    // When dev.writeToDisk is configured as false,
    // the renderHandler needs to read the html file in memory through the fileReader
    const { outputFileSystem } =
      'compilers' in compiler ? compiler.compilers[0] : compiler;
    if (outputFileSystem) {
      fileReader.reset(outputFileSystem as unknown as typeof fs);
    } else {
      fileReader.reset();
    }
    return next();
  };
};
