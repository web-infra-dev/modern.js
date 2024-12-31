import path from 'path';
import type { ServerPlugin } from '@modern-js/server-core';

export const API_APP_PACKAGE_NAME = '{packageName}';
export const API_APP_PREFIX = '{prefix}';

const API_DIR = 'api';
const DIST_DIR = 'dist';
const LAMBDA_DIR = 'lambda';
const NODE_MODULES = 'node_modules';

export const serverPlugin = (): ServerPlugin => ({
  name: '@modern-js/plugin-independent-bff',
  setup: api => {
    return {
      async prepare() {
        const cwd = process.cwd();

        const sdkPath = path.join(cwd, NODE_MODULES, API_APP_PACKAGE_NAME);

        const sdkDistPath = path.join(sdkPath, DIST_DIR);
        const apiDirectory = path.join(sdkDistPath, API_DIR);
        const lambdaDirectory = path.resolve(sdkDistPath, API_DIR, LAMBDA_DIR);

        const appContext = api.useAppContext();

        api.setAppContext({
          ...appContext,
          apiDirectory,
          lambdaDirectory,
          indepBffPrefix: API_APP_PREFIX,
        });
      },
    };
  },
});

export default serverPlugin;
