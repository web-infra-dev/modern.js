import * as path from 'path';
import * as os from 'os';
import fs from 'fs';
import Module from 'module';

interface Paths {
  [key: string]: string[] | string;
}

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

const sortByLongestPrefix = (arr: Array<string>): Array<string> => {
  return arr.concat().sort((a: string, b: string) => b.length - a.length);
};

export const createMatchPath = (paths: Paths) => {
  const sortedKeys = sortByLongestPrefix(Object.keys(paths));
  const sortedPaths: Paths = {};
  sortedKeys.forEach((key: string) => {
    sortedPaths[key] = paths[key];
  });
  return (request: string) => {
    const found = Object.keys(sortedPaths).find(key => {
      return request.startsWith(key);
    });
    if (found) {
      let foundPaths = sortedPaths[found];
      if (!Array.isArray(foundPaths)) {
        foundPaths = [foundPaths];
      }
      foundPaths = foundPaths.filter(foundPath => path.isAbsolute(foundPath));
      for (const p of foundPaths) {
        const foundPath = request.replace(found, p);
        if (fs.existsSync(foundPath)) {
          return foundPath;
        }
      }
      return request.replace(found, foundPaths[0]);
    }
    return null;
  };
};

// every path must be a absolute path;
export const registerPaths = (paths: Paths) => {
  const originalResolveFilename = (Module as any)._resolveFilename;
  // eslint-disable-next-line node/no-unsupported-features/node-builtins
  const { builtinModules } = Module;
  const matchPath = createMatchPath(paths);
  (Module as any)._resolveFilename = function (
    request: string,
    _parent: any,
  ): string {
    const isCoreModule = builtinModules.includes(request);
    if (!isCoreModule) {
      const matched = matchPath(request);
      if (matched) {
        // eslint-disable-next-line prefer-rest-params
        const modifiedArguments = [matched, ...[].slice.call(arguments, 1)]; // Passes all arguments. Even those that is not specified above.
        return originalResolveFilename.apply(this, modifiedArguments);
      }
    }
    // eslint-disable-next-line prefer-rest-params
    return originalResolveFilename.apply(this, arguments);
  };

  return () => {
    (Module as any)._resolveFilename = originalResolveFilename;
  };
};
