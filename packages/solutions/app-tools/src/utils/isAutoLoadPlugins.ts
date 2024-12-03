import { createLoadedConfig } from '@modern-js/plugin-v2/cli';
export async function isAutoLoadPlugins(
  appDirectory: string,
  configFile = 'modern.config.ts',
  packageJsonConfig = 'ModernConfig',
) {
  const loaded = await createLoadedConfig<{ autoLoadPlugins: boolean }>(
    appDirectory,
    configFile,
    packageJsonConfig,
  );
  const autoLoadPlugins = loaded.config?.autoLoadPlugins;

  return autoLoadPlugins || false;
}
