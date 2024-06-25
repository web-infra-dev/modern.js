import { merge } from 'ts-deepmerge';
import { CliConfig, ServerConfig } from '../types';

/**
 * 对配置进行合并，cliConfig 与 serverConfig 进行深合并
 */
export const loadConfig = ({
  cliConfig,
  serverConfig,
}: {
  cliConfig: CliConfig;
  serverConfig: ServerConfig;
}): ServerConfig => {
  const config = merge(
    {
      ...cliConfig,
      plugins: [],
    },
    serverConfig,
  );

  return config;
};
