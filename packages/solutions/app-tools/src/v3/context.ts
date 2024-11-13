import path from 'path';
import { address } from '@modern-js/utils';

export const initAppContext = ({
  appDirectory,
  runtimeConfigFile,
  options,
  serverConfigFile,
}: {
  appDirectory: string;
  runtimeConfigFile: string | false;
  options?: {
    metaName?: string;
    srcDir?: string;
    apiDir?: string;
    distDir?: string;
    sharedDir?: string;
  };
  serverConfigFile: string;
}) => {
  const {
    metaName = 'modern-js',
    apiDir = 'api',
    sharedDir = 'shared',
  } = options || {};
  return {
    metaName,
    runtimeConfigFile,
    serverConfigFile,
    ip: address.ip(),
    port: 0,
    moduleType:
      require(path.resolve(appDirectory, './package.json')).type || 'commonjs',
    apiDirectory: path.resolve(appDirectory, apiDir),
    lambdaDirectory: path.resolve(appDirectory, apiDir, 'lambda'),
    sharedDirectory: path.resolve(appDirectory, sharedDir),
    serverPlugins: [],
    internalDirectory: path.resolve(
      appDirectory,
      `./node_modules/.${metaName}`,
    ),
    htmlTemplates: {},
    serverRoutes: [],
    entrypoints: [],
    checkedEntries: [],
    apiOnly: false,
    internalDirAlias: `@_${metaName.replace(/-/g, '_')}_internal`,
    internalSrcAlias: `@_${metaName.replace(/-/g, '_')}_src`,
  };
};
