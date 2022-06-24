import Module from 'module';
import * as path from 'path';

const serverRuntimeAlias = '@modern-js/runtime/server';
const serverRuntimePath = '.runtime-exports/server';

const registerModernRuntimePath = (internalDirectory: string) => {
  const originalResolveFilename = (Module as any)._resolveFilename;
  // eslint-disable-next-line node/no-unsupported-features/node-builtins
  const { builtinModules } = Module;
  (Module as any)._resolveFilename = function (
    request: string,
    _parent: any,
  ): string {
    const isCoreModule = builtinModules.includes(request);
    if (!isCoreModule) {
      if (request === serverRuntimeAlias) {
        const found = path.join(internalDirectory, serverRuntimePath);
        if (found) {
          // eslint-disable-next-line prefer-rest-params
          const modifiedArguments = [found, ...[].slice.call(arguments, 1)]; // Passes all arguments. Even those that is not specified above.
          return originalResolveFilename.apply(this, modifiedArguments);
        }
      }
    }
    // eslint-disable-next-line prefer-rest-params
    return originalResolveFilename.apply(this, arguments);
  };

  return () => {
    (Module as any)._resolveFilename = originalResolveFilename;
  };
};

export { registerModernRuntimePath };
