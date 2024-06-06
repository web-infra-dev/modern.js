import { fileReader } from '@modern-js/runtime-utils/fileReader';
import { Middleware } from '@modern-js/server-core';

export const initFileReader = (): Middleware => {
  let isInit = false;

  return async (ctx, next) => {
    if (isInit) {
      return next();
    }
    isInit = true;

    const { res } = ctx.env.node;
    if (!res.locals?.webpack) {
      fileReader.reset();
      return next();
    }

    // When devServer.devMiddleware.writeToDisk is configured as false,
    // the renderHandler needs to read the html file in memory through the fileReader
    const { devMiddleware: webpackDevMid } = res.locals.webpack;
    const { outputFileSystem } = webpackDevMid;
    if (outputFileSystem) {
      fileReader.reset(outputFileSystem);
    } else {
      fileReader.reset();
    }
    return next();
  };
};
