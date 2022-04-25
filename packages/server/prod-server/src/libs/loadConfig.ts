import * as path from 'path';
import { compatRequire, fs, DEFAULT_SERVER_CONFIG } from '@modern-js/utils';
import type { NormalizedConfig } from '@modern-js/core';
import type { ServerConfig } from '@modern-js/server-core';
import mergeDeep from 'merge-deep';

export const getServerConfigPath = (
  distDirectory: string,
  serverConfigFile: string = DEFAULT_SERVER_CONFIG,
) => {
  const serverConfigPath = path.join(distDirectory, serverConfigFile);
  return `${serverConfigPath}.js`;
};

export const requireConfig = (serverConfigPath: string) => {
  if (fs.pathExistsSync(serverConfigPath)) {
    return compatRequire(serverConfigPath);
  }

  return {};
};

/**
 * 对配置进行合并，开发环境下,cliConfig 与 serverConfig 进行深合并
 * 生产环境下，resolvedConfig 与 serverConfig 进行深合并
 * resolvedConfigPath: 构建序列化后的 modern.config.js 文件路径
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
    // cli config has a higher priority,because it's an argument passed in.
    config = mergeDeep(
      {
        ...resolvedConfig,
        plugins: [], // filter cli plugins
      },
      serverConfig,
      cliConfig,
    );
  } else {
    config = mergeDeep(
      {
        ...cliConfig,
        plugins: [],
      },
      serverConfig,
    );
  }
  return config;
};
