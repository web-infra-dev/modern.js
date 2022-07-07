import * as path from 'path';
import { registerPaths } from '@modern-js/bff-core';

const serverRuntimeAlias = '@modern-js/runtime/server';
const serverRuntimePath = '.runtime-exports/server';

const registerModernRuntimePath = (internalDirectory: string) => {
  const paths = {
    [serverRuntimeAlias]: path.join(internalDirectory, serverRuntimePath),
  };
  const unRegister = registerPaths(paths);
  return unRegister;
};

export { registerModernRuntimePath };
