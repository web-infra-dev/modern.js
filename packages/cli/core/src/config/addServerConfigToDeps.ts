import { getServerConfig } from '@modern-js/utils';

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
