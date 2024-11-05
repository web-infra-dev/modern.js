import path from 'path';
import { initHooks } from './hooks';
import type { CLIPlugin } from './types';
import type { AppContext, InternalContext } from './types/context';

interface ContextParams<Config, NormalizedConfig> {
  appContext: AppContext<Config, NormalizedConfig>;
  config: Config;
  normalizedConfig: NormalizedConfig;
}

export function initAppContext<Config, NormalizedConfig>(params: {
  packageName: string;
  configFile: string;
  command: string;
  appDirectory: string;
  plugins: CLIPlugin<Config, NormalizedConfig>[];
  srcDir?: string;
  distDir?: string;
}): AppContext<Config, NormalizedConfig> {
  const { appDirectory, srcDir = 'src', distDir = 'dist' } = params;
  return {
    packageName: params.packageName,
    configFile: params.configFile,
    command: params.command,
    isProd: process.env.NODE_ENV === 'production',
    appDirectory: appDirectory,
    srcDirectory: path.resolve(appDirectory, srcDir),
    distDirectory: path.resolve(appDirectory, distDir),
    nodeModulesDirectory: path.resolve(appDirectory, 'node_modules'),
    plugins: params.plugins,
  };
}

export async function createContext<Config, NormalizedConfig>({
  appContext,
  config,
  normalizedConfig,
}: ContextParams<Config, NormalizedConfig>): Promise<
  InternalContext<Config, NormalizedConfig>
> {
  return {
    ...appContext,
    hooks: initHooks<Config, NormalizedConfig>(),
    config,
    normalizedConfig,
  };
}
