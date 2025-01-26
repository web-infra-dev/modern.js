import { createLoadedConfig, loadEnv } from '@modern-js/plugin-v2/cli';
export async function isAutoLoadPlugins(
  appDirectory: string,
  configFile: string,
  packageJsonConfig: string,
  metaName: string,
) {
  loadEnv(appDirectory, process.env[`${metaName.toUpperCase()}_ENV`]);
  const loaded = await createLoadedConfig<{ autoLoadPlugins: boolean }>(
    appDirectory,
    configFile,
    packageJsonConfig,
  );
  const autoLoadPlugins = loaded.config?.autoLoadPlugins;

  return autoLoadPlugins || false;
}
