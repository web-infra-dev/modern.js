import path from 'path';
import { fs, getServerConfig } from '@modern-js/utils';
import { IAppContext } from '../types';

/**
 * Get user config from package.json.
 * @param appDirectory - App root directory.
 * @returns modernConfig or undefined
 */
// FIXME: read package.json again;
const getPackageConfig = <T>(
  appDirectory: string,
  packageJsonConfig?: string,
) => {
  const PACKAGE_JSON_CONFIG_NAME = 'modernConfig';
  const json = JSON.parse(
    fs.readFileSync(path.resolve(appDirectory, './package.json'), 'utf8'),
  );

  return json[packageJsonConfig ?? PACKAGE_JSON_CONFIG_NAME] as T | undefined;
};

export const addServerConfigToDeps = async (
  dependencies: string[],
  appDirectory: string,
  serverConfigFile: string,
) => {
  const serverConfig = await getServerConfig(appDirectory, serverConfigFile);
  if (serverConfig) {
    dependencies.push(serverConfig);
  }
};

export async function generateWatchFiles(
  appContext: IAppContext,
  configDir?: string,
): Promise<string[]> {
  const { appDirectory, configFile } = appContext;
  const configPath = path.join(appDirectory, configDir || '');

  const dependencies: string[] = getPackageConfig(
    appContext.appDirectory,
    appContext.packageName,
  )
    ? [path.resolve(appDirectory, './package.json')]
    : [];

  await addServerConfigToDeps(
    dependencies,
    appContext.appDirectory,
    appContext.serverConfigFile,
  );
  return [`${configPath}/html`, configFile || './config', ...dependencies];
}
