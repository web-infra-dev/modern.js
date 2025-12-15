import { merge } from '@modern-js/utils/lodash';
import type { CliConfig, UserConfig } from '../../../types';
export function getServerCliConfig(
  userConfig: UserConfig = {},
  cliConfig?: CliConfig,
): CliConfig {
  const defaultConfig: CliConfig = {
    output: {},
    source: {},
    tools: {},
    server: {},
    security: {},
    bff: {},
    html: {},
    dev: {},
  };

  const mergedCliConfig = merge(userConfig, cliConfig || defaultConfig);

  return mergedCliConfig;
}
