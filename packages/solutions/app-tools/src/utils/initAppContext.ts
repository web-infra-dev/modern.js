import path from 'path';
import { fs, address } from '@modern-js/utils';

export const initAppContext = ({
  metaName,
  appDirectory,
  runtimeConfigFile,
  options,
  tempDir,
}: {
  metaName: string;
  appDirectory: string;
  runtimeConfigFile: string;
  options?: {
    srcDir?: string;
    apiDir?: string;
    distDir?: string;
    sharedDir?: string;
  };
  tempDir?: string;
}) => {
  const { apiDir = 'api', sharedDir = 'shared' } = options || {};
  const pkgPath = path.resolve(appDirectory, './package.json');

  const moduleType = fs.existsSync(pkgPath)
    ? fs.readJSONSync(pkgPath).type || 'commonjs'
    : 'commonjs';

  return {
    runtimeConfigFile,
    ip: address.ip(),
    port: 0,
    moduleType,
    apiDirectory: path.resolve(appDirectory, apiDir),
    lambdaDirectory: path.resolve(appDirectory, apiDir, 'lambda'),
    sharedDirectory: path.resolve(appDirectory, sharedDir),
    serverPlugins: [],
    internalDirectory: path.resolve(
      appDirectory,
      tempDir || `./node_modules/.${metaName}`,
    ),
    htmlTemplates: {},
    serverRoutes: [],
    entrypoints: [],
    checkedEntries: [],
    apiOnly: false,
    internalDirAlias: `@_${metaName.replace(/-/g, '_')}_internal`,
    internalSrcAlias: `@_${metaName.replace(/-/g, '_')}_src`,
    bffRuntimeFramework: 'hono',
  };
};
