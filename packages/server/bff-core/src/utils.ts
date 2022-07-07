import util from 'util';
import fs from 'fs';
import Module from 'module';
import path from 'path';
import { createDebugger } from '@modern-js/utils';

export const HANDLER_WITH_META = 'HANDLER_WITH_META';

export const debug = createDebugger('bff');

// export const pick = <T extends Record<string, unknown>, K extends keyof T>(
//   obj: T,
//   keys: readonly K[],
// ) => {
//   Object.entries(obj).filter(([key]) => {
//     return (keys as readonly string[]).includes(key);
//   });
// };

// fork from https://github.com/nodejs/node/blob/master/lib/internal/errors.js
export const getTypeErrorMessage = (actual: unknown) => {
  let msg = '';
  if (actual == null) {
    msg += `. Received ${actual}`;
  } else if (typeof actual === 'function' && actual.name) {
    msg += `. Received function ${actual.name}`;
  } else if (typeof actual === 'object') {
    if (actual.constructor?.name) {
      msg += `. Received an instance of ${actual.constructor.name}`;
    } else {
      const inspected = util.inspect(actual, { depth: -1 });
      msg += `. Received ${inspected}`;
    }
  } else {
    let inspected = util.inspect(actual, { colors: false });
    if (inspected.length > 25) {
      inspected = `${inspected.slice(0, 25)}...`;
    }
    msg += `. Received type ${typeof actual} (${inspected})`;
  }
  return msg;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export class ERR_INVALID_ARG_TYPE extends Error {
  constructor(funcName: string, expectedType: string, actual: unknown) {
    const message = `[ERR_INVALID_ARG_TYPE]: The '${funcName}' argument must be of type ${expectedType}${getTypeErrorMessage(
      actual,
    )}`;
    super(message);
  }
}

export const validateFunction = (maybeFunc: unknown, name: string) => {
  if (typeof maybeFunc !== 'function') {
    throw new ERR_INVALID_ARG_TYPE(name, 'function', maybeFunc);
  }
  return true;
};

export const isWithMetaHandler = (handler: any) => {
  return typeof handler === 'function' && handler[HANDLER_WITH_META];
};

interface Paths {
  [key: string]: string[] | string;
}

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
