import path from 'path';
import { compatRequire, fs, DEFAULT_SERVER_CONFIG } from '@modern-js/utils';
import { ServerConfig } from '../../../types';

const requireConfig = (serverConfigPath: string): ServerConfig | undefined => {
  if (fs.pathExistsSync(serverConfigPath)) {
    return compatRequire(serverConfigPath);
  }
  return undefined;
};

function loadServerConfigNew(
  serverConfigPath: string,
): ServerConfig | undefined {
  const serverConfigFile = serverConfigPath.endsWith('.js')
    ? serverConfigPath
    : `${serverConfigPath}.js`;
  return requireConfig(serverConfigFile);
}

function loadServerConfigOld(pwd: string, configFile: string): ServerConfig {
  const serverConfigPath = path.join(pwd, `${configFile}.js`);
  const serverConfig = requireConfig(serverConfigPath);
  return serverConfig || {};
}

export function loadServerConfig(
  pwd: string,
  oldServerFile: string = DEFAULT_SERVER_CONFIG,
  newServerConfigPath?: string,
) {
  const newServerConfig =
    newServerConfigPath && loadServerConfigNew(newServerConfigPath);

  if (newServerConfig) {
    return newServerConfig;
  }

  const oldServerConfig = loadServerConfigOld(pwd, oldServerFile);
  return oldServerConfig;
}
