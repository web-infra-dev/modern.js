import * as path from 'path';
import * as os from 'os';

type HandlerInfo = {
  handler: (...args: any[]) => any;
  name: string;
  httpMethod: string;
  routeName: string;
  routePath: string;
};

export const sortDynamicRoutes = (apiHandlers: HandlerInfo[]) => {
  apiHandlers.forEach((apiHandler, handlerIndex) => {
    if (apiHandler.routeName.includes(':')) {
      apiHandlers.splice(handlerIndex, 1);
      apiHandlers.push(apiHandler);
    }
  });
};

export const getRelativeRuntimePath = (
  appDirectory: string,
  serverRuntimePath: string,
) => {
  let relativeRuntimePath = '';
  if (os.platform() === 'win32') {
    // isRelative function in babel-plugin-resolver plugin can't handle windows relative path correctly, see babel-plugin-resolver's utils.
    relativeRuntimePath = `../${path.relative(
      appDirectory,
      serverRuntimePath,
    )}`;
  } else {
    // Look up one level, because the artifacts after build have dist directories
    relativeRuntimePath = path.join(
      '../',
      path.relative(appDirectory, serverRuntimePath),
    );
  }

  if (
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === 'test'
  ) {
    relativeRuntimePath = `./${path.relative(appDirectory, serverRuntimePath)}`;
  }

  return relativeRuntimePath;
};
