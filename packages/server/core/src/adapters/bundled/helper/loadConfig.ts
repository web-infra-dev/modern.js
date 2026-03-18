import { OUTPUT_CONFIG_FILE, lodash as _ } from '@modern-js/utils';
import { fromJSON } from 'flatted';
import type { CliConfig, ServerConfig, UserConfig } from '../../../types';
import { getBundledDep } from './getBundledDep';

export async function loadBundledServerRuntimeConfig(
  serverConfigPath: string,
  deps?: Record<string, Promise<any>>,
): Promise<ServerConfig | undefined> {
  const mod = await getBundledDep(serverConfigPath, deps);
  if (mod) {
    return mod;
  }
  return undefined;
}

export async function loadBundledServerCliConfig(
  defaultConfig: UserConfig = {},
  deps?: Record<string, Promise<any>>,
): Promise<CliConfig> {
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

  try {
    const inputConfig = await getBundledDep(OUTPUT_CONFIG_FILE, deps);
    cliConfig = fromJSON(inputConfig);
  } catch (_) {
    // ignore
  }

  const mergedCliConfig = _.merge(defaultConfig, cliConfig);

  return mergedCliConfig;
}
