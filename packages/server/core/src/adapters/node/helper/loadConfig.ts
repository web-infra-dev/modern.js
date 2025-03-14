import path from 'path';
import {
  fs,
  DEFAULT_SERVER_CONFIG,
  OUTPUT_CONFIG_FILE,
  lodash as _,
  compatibleRequire,
  ensureAbsolutePath,
  requireExistModule,
} from '@modern-js/utils';
import { parse } from 'flatted';
import type { CliConfig, ServerConfig, UserConfig } from '../../../types';

export async function loadServerRuntimeConfig(
  serverConfigPath: string,
): Promise<ServerConfig | undefined> {
  const mod: ServerConfig | null = await requireExistModule(serverConfigPath);

  if (mod) {
    return mod;
  }
  return undefined;
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
    runtime: {},
    bff: {},
    html: {},
    dev: {},
  };

  try {
    const content = fs.readFileSync(cliConfigPath, 'utf-8');

    cliConfig = parse(content);
  } catch (_) {
    // ignore
  }

  const mergedCliConfig = _.merge(defaultConfig, cliConfig);

  return mergedCliConfig;
}
