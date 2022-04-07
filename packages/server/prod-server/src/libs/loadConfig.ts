import * as path from 'path';
import {
  CONFIG_CACHE_DIR,
  compatRequire,
  fs,
  DEFAULT_SERVER_CONFIG,
} from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';
import type { ServerConfig } from '@modern-js/server-core';
import merge from 'merge-deep';
import { debug } from '../utils';

export const getServerConfigPath = (
  appDirectory: string,
  serverConfigFile: string = DEFAULT_SERVER_CONFIG,
) => {
  const serverConfigPath = path.join(
    appDirectory,
    CONFIG_CACHE_DIR,
    serverConfigFile,
  );
  return `${serverConfigPath}.js`;
};

export const requireConfig = (serverConfigPath: string) => {
  if (fs.pathExistsSync(serverConfigPath)) {
    try {
      return compatRequire(serverConfigPath);
    } catch (error) {
      debug(error);
      return {};
    }
  }

  return {};
};

export const mergeConfig = (
  cliConfig: NormalizedConfig,
  serverConfig: ServerConfig,
) => {
  return merge(cliConfig, serverConfig);
};

/**
 * resolvedConfigPath 构建生成的 modern.config.js 文件路径
 */
export const loadConfig = ({
  cliConfig,
  serverConfig,
  resolvedConfigPath,
}: {
  cliConfig: NormalizedConfig;
  serverConfig: ServerConfig;
  resolvedConfigPath: string;
}) => {
  let config = null;
  if (process.env.NODE_ENV === 'production') {
    const resolvedConfig = requireConfig(resolvedConfigPath);
    config = mergeConfig(
      {
        ...resolvedConfig,
        plugins: [], // filter cli plugins
      },
      serverConfig,
    );
  } else {
    config = mergeConfig(
      {
        ...cliConfig,
        plugins: [],
      },
      serverConfig,
    );
  }
  return config;
};
