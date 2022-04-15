import * as path from 'path';
import * as os from 'os';

type HanlderInfo = {
  handler: (...args: any[]) => any;
  method: string;
  name: string;
};

export const sortDynamicRoutes = (apiHandlers: HanlderInfo[]) => {
  apiHandlers.forEach((apiHandler, handlerIndex) => {
    if (apiHandler.name.includes(':')) {
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
  // Compatible with babel-plugin-resolver's handling of relative paths on Windows
  if (os.platform() === 'win32') {
    relativeRuntimePath = path.join(
      '../../',
      path.relative(appDirectory, serverRuntimePath),
    );
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
