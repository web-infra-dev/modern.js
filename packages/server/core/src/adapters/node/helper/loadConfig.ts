import path from 'path';
import {
  fs,
  OUTPUT_CONFIG_FILE,
  lodash as _,
  ensureAbsolutePath,
  requireExistModule,
} from '@modern-js/utils';
import { parse } from 'flatted';
import type { CliConfig, ServerConfig, UserConfig } from '../../../types';

async function loadServerConfigNew(
  serverConfigPath: string,
): Promise<ServerConfig | undefined> {
  const mod: ServerConfig | null = await requireExistModule(serverConfigPath);

  if (mod) {
    return mod;
  }
  return undefined;
}

export async function loadServerRuntimeConfig(serverConfigPath: string) {
  const newServerConfig = await loadServerConfigNew(serverConfigPath);
  return newServerConfig;
}

export function loadServerCliConfig(
  pwd: string,
  defaultConfig: UserConfig = {},
): CliConfig {
  const cliConfigPath = ensureAbsolutePath(
    pwd,
    path.join(
      defaultConfig.output?.distPath?.root || 'dist',
      OUTPUT_CONFIG_FILE,
    ),
  );

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
    const content = fs.readFileSync(cliConfigPath, 'utf-8');

    cliConfig = parse(content);
  } catch {
    // ignore
  }

  const mergedCliConfig = _.merge(defaultConfig, cliConfig);

  return mergedCliConfig;
}
