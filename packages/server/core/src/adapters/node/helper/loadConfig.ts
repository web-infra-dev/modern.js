import path from 'path';
import {
  fs,
  DEFAULT_SERVER_CONFIG,
  OUTPUT_CONFIG_FILE,
  lodash as _,
  chalk,
  compatibleRequire,
  ensureAbsolutePath,
  getMeta,
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

export async function loadServerRuntimeConfig(
  pwd: string,
  oldServerFile: string = DEFAULT_SERVER_CONFIG,
  newServerConfigPath?: string,
  metaName?: string,
) {
  const newServerConfig =
    newServerConfigPath && (await loadServerConfigNew(newServerConfigPath));

  if (newServerConfig) {
    return newServerConfig;
  }

  const oldServerConfig = await loadServerConfigOld(pwd, oldServerFile);
  if (oldServerConfig) {
    const meta = getMeta(metaName);
    console.warn(
      `${chalk.red('\n[Warning]')} ${chalk.yellow.bold(`\`${oldServerFile}\``)} is no longer maintained. To extend the server, please migrate to ${chalk.yellow.bold(`\`server/${meta}.server.ts\``)};`,
    );
  }
  return oldServerConfig;
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
