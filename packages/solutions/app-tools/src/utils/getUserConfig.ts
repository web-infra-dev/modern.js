import { createLoadedConfig, loadEnv } from '@modern-js/plugin-v2/cli';
import type { AppTools, CliPlugin, CliPluginFuture } from '../types';
export async function getUserConfig(
  appDirectory: string,
  configFile: string,
  packageJsonConfig: string,
  metaName: string,
) {
  const envName = metaName === 'modern-js' ? 'MODERN' : metaName;
  loadEnv(appDirectory, process.env[`${envName.toUpperCase()}_ENV`]);
  const loaded = await createLoadedConfig<{
    autoLoadPlugins: boolean;
    runtime: boolean | Record<string, any>;
    plugins: (CliPlugin<AppTools> | CliPluginFuture<AppTools>)[];
  }>(appDirectory, configFile, packageJsonConfig);
  return loaded.config || {};
}
