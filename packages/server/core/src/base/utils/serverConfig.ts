import { DEFAULT_SERVER_CONFIG } from '@modern-js/utils/universal/constants';
import { ServerConfig } from '../../core/plugin';
import type { ServerOptions } from '../../types/config';
import { getPathModule } from './path';
import { checkIsProd } from './env';

export const getServerConfigPath = async (
  distDirectory: string,
  serverConfigFile: string = DEFAULT_SERVER_CONFIG,
) => {
  const path = await getPathModule();
  const serverConfigPath = path.join(distDirectory, serverConfigFile);
  return `${serverConfigPath}.js`;
};

export const requireConfig = (serverConfigPath: string) => {
  return import(serverConfigPath).catch(_ => ({}));
};

/**
 * 对配置进行合并，开发环境下，cliConfig 与 serverConfig 进行深合并
 * 生产环境下，resolvedConfig 与 serverConfig 进行深合并
 * resolvedConfigPath: 构建序列化后的 modern.config.js 文件路径
 */
export const loadConfig = ({
  cliConfig,
  serverConfig,
}: // resolvedConfigPath,
{
  cliConfig: ServerOptions;
  serverConfig: ServerConfig;
  resolvedConfigPath: string;
}) => {
  const config = {} as any;

  if (checkIsProd()) {
    // const resolvedConfig = requireConfig(resolvedConfigPath);
    // cli config has a higher priority,because it's an argument passed in.

    return {
      // ...resolvedConfig,
      plugins: [],
      ...serverConfig,
      ...cliConfig,
    };

    // config = mergeDeep(
    //   {
    //     ...resolvedConfig,
    //     plugins: [], // filter cli plugins
    //   },
    //   serverConfig,
    //   cliConfig,
    // );
  } else {
    return {
      ...cliConfig,
      plugins: [],
      ...serverConfig,
    };
    // config = mergeDeep(
    //   {
    //     ...cliConfig,
    //     plugins: [],
    //   },
    //   serverConfig,
    // );
  }
  return config;
};
