import path from 'path';
import {
  compatRequire,
  fs,
  DEFAULT_SERVER_CONFIG,
  requireExistModule,
  ensureAbsolutePath,
  OUTPUT_CONFIG_FILE,
  lodash as _,
} from '@modern-js/utils';
import { CliConfig, ServerConfig, UserConfig } from '../../../types';

const requireConfig = (serverConfigPath: string): ServerConfig | undefined => {
  if (fs.pathExistsSync(serverConfigPath)) {
    return compatRequire(serverConfigPath);
  }
  return undefined;
};

function loadServerConfigNew(
  serverConfigPath: string,
): ServerConfig | undefined {
  const mod: ServerConfig | null = requireExistModule(serverConfigPath);

  if (mod) {
    return mod;
  }
  return undefined;
}

function loadServerConfigOld(
  pwd: string,
  configFile: string,
): ServerConfig | undefined {
  const serverConfigPath = path.join(pwd, `${configFile}.js`);
  const serverConfig = requireConfig(serverConfigPath);
  return serverConfig;
}

export function loadServerRuntimeConfig(
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

export function loadServerCliConfig(
  pwd: string,
  defaultConfig: UserConfig = {},
): CliConfig {
  const cliConfigPath = ensureAbsolutePath(
    pwd,
    path.join(defaultConfig.output?.path || 'dist', OUTPUT_CONFIG_FILE),
  );

  let cliConfig: CliConfig = {
    output: {},
    source: {},
    tools: {},
    server: {},
    security: {},
    runtime: {},
    bff: {},
    html: {},
    dev: {},
  };

  try {
    cliConfig = require(cliConfigPath);
  } catch (_) {
    // ignore
  }

  const mergedCliConfig = _.merge(defaultConfig, cliConfig);

  return mergedCliConfig;
}
