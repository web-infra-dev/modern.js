import { deepmerge } from 'deepmerge-ts';
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
  const config = deepmerge(
    {
      ...cliConfig,
      plugins: [],
    },
    serverConfig,
  );

  return config;
};
