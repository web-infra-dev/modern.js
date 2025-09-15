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
    api.modifyResolvedConfig(resolvedConfig => {
      const { appDirectory: originAppDirectory } = api.getAppContext();

      const sdkPath = path.join(originAppDirectory, NODE_MODULES, PACKAGE_NAME);

      const sdkDistPath = path.join(sdkPath, DIST_DIR);
      const apiDirectory = path.join(sdkDistPath, API_DIR);
      const lambdaDirectory = path.resolve(sdkDistPath, LAMBDA_DIR);

      api.updateAppContext({
        apiDirectory,
        lambdaDirectory,
      });
      const config = api.getConfig();
      if (config?.bff?.prefix) {
        console.warn(
          `[WARNING] Detected bff.prefix configuration: "${config.bff.prefix}".
When using cross-project BFF, you should not configure bff.prefix as it may cause API path conflicts or access issues. Please remove the bff.prefix configuration.`,
        );
      }
      resolvedConfig.bff.prefix = PREFIX;
      (resolvedConfig.bff as any).isCrossProjectServer = true;
      return resolvedConfig;
    });
  },
});

export default crossProjectApiPlugin;
