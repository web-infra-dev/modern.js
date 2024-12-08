import path from 'path';
import { fs, address } from '@modern-js/utils';

export const initAppContext = ({
  appDirectory,
  runtimeConfigFile,
  options,
  serverConfigFile,
  tempDir,
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
  tempDir?: string;
}) => {
  const {
    metaName = 'modern-js',
    apiDir = 'api',
    distDir = '',
    sharedDir = 'shared',
  } = options || {};
  const pkgPath = path.resolve(appDirectory, './package.json');
  return {
    metaName,
    runtimeConfigFile,
    serverConfigFile,
    ip: address.ip(),
    port: 0,
    moduleType: fs.existsSync(pkgPath)
      ? require(pkgPath).type || 'commonjs'
      : 'commonjs',
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
  };
};
