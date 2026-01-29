import path from 'path';
import {
  fs,
  OUTPUT_CONFIG_FILE,
  lodash as _,
  compatibleRequire,
  ensureAbsolutePath,
  requireExistModule,
} from '@modern-js/utils';
import { fromJSON, parse } from 'flatted';
import type { CliConfig, ServerConfig, UserConfig } from '../../../types';
import { getBundledDep } from './getBundledDep';

export async function loadServerRuntimeConfig(serverConfigPath: string) {
  const mod: ServerConfig | null = await requireExistModule(serverConfigPath);

  if (mod) {
    return mod;
  }
  return undefined;
}

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

export async function loadServerCliConfig(
  pwd: string,
  defaultConfig: UserConfig = {},
): Promise<CliConfig> {
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
    const content = await fs.readFile(cliConfigPath, 'utf-8');

    cliConfig = parse(content);
  } catch (_) {
    // ignore
  }

  const mergedCliConfig = _.merge(defaultConfig, cliConfig);

  return mergedCliConfig;
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
