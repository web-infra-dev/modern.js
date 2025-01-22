import path from 'path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';

export const PACKAGE_NAME = '{packageName}';
export const PREFIX = '{prefix}';
export const API_DIR = '{apiDirectory}';
export const LAMBDA_DIR = '{lambdaDirectory}';
export const DIST_DIR = '{distDirectory}';

const NODE_MODULES = 'node_modules';

export const crossProjectApiPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-independent-bff',
  post: ['@modern-js/plugin-bff'],
  setup: api => {
    return {
      config() {
        const { appDirectory: originAppDirectory } = api.useAppContext();

        const sdkPath = path.join(
          originAppDirectory,
          NODE_MODULES,
          PACKAGE_NAME,
        );

        const sdkDistPath = path.join(sdkPath, DIST_DIR);
        const apiDirectory = path.join(sdkDistPath, API_DIR);
        const lambdaDirectory = path.resolve(sdkDistPath, LAMBDA_DIR);

        const appContext = api.useAppContext();

        api.setAppContext({
          ...appContext,
          apiDirectory,
          lambdaDirectory,
        });
        const config = api.useConfigContext();
        config.bff = {
          ...config.bff,
          prefix: PREFIX,
          isCrossProjectServer: true,
        } as any;
        return {};
      },
    };
  },
});

export default crossProjectApiPlugin;
