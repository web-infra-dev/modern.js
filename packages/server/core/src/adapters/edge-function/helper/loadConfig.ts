import { merge } from '@modern-js/utils/lodash';
import { fromJSON } from 'flatted';
import type { CliConfig, UserConfig } from '../../../types';
export function getServerCliConfig(
  userConfig: UserConfig = {},
  inputConfig?: CliConfig,
): CliConfig {
  let cliConfig: CliConfig = {
    output: {},
    source: {},
    tools: {},
    server: {},
    security: {},
    bff: {},
    html: {},
    dev: {},
  };

  if (inputConfig) {
    try {
      cliConfig = fromJSON(inputConfig);
    } catch (e) {
      // ignore
    }
  }

  const mergedCliConfig = merge(userConfig, cliConfig);

  return mergedCliConfig;
}
