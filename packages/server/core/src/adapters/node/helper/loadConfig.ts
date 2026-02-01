import path from 'path';
import {
  fs,
  OUTPUT_CONFIG_FILE,
  lodash as _,
  compatibleRequire,
  ensureAbsolutePath,
  requireExistModule,
} from '@modern-js/utils';
import { parse } from 'flatted';
import type { CliConfig, ServerConfig, UserConfig } from '../../../types';

const requireConfig = async (
  serverConfigPath: string,
): Promise<ServerConfig | undefined> => {
  if (fs.pathExistsSync(serverConfigPath)) {
    return compatibleRequire(serverConfigPath);
  }
  return undefined;
};

async function loadServerConfigNew(
  serverConfigPath: string,
): Promise<ServerConfig | undefined> {
  const mod: ServerConfig | null = await requireExistModule(serverConfigPath);

  if (mod) {
    return mod;
  }
  return undefined;
}

async function loadServerConfigOld(
  pwd: string,
  configFile: string,
): Promise<ServerConfig | undefined> {
  const serverConfigPath = path.join(pwd, `${configFile}.cjs`);
  const serverConfig = await requireConfig(serverConfigPath);
  return serverConfig;
}

export async function loadServerRuntimeConfig(serverConfigPath: string) {
  const newServerConfig = await loadServerConfigNew(serverConfigPath);
  return newServerConfig;
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
