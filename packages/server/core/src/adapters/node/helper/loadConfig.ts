import path from 'path';
import {
  compatRequire,
  fs,
  getMeta,
  DEFAULT_SERVER_CONFIG,
} from '@modern-js/utils';
import { ServerConfig } from '../../../types';

const requireConfig = (serverConfigPath: string): ServerConfig | undefined => {
  if (fs.pathExistsSync(serverConfigPath)) {
    return compatRequire(serverConfigPath);
  }
  return undefined;
};

export function loadServerConfig(
  pwd: string,
  metaName = 'modern-js',
  compatConfigFile = DEFAULT_SERVER_CONFIG,
): ServerConfig {
  const meta = getMeta(metaName);

  const configFileName = `${meta}.server.js`;

  const serverConfigPath = path.join(pwd, 'server', configFileName);

  const serverConfig = requireConfig(serverConfigPath);

  if (serverConfig) {
    return serverConfig;
  }
  const serverConfigPathOld = path.join(pwd, `${compatConfigFile}.js`);
  const serverConfigOld = requireConfig(serverConfigPathOld);
  return serverConfigOld || {};
}

export function loadServerConfig1(serverConfigPath: string): ServerConfig {
  if (fs.pathExistsSync(serverConfigPath)) {
    return compatRequire(serverConfigPath);
  }
  return {};
}
