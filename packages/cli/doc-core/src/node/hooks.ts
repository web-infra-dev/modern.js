import { UserConfig, DocPlugin } from 'shared/types';

type HookOptions = {
  config: UserConfig;
  docPlugins: DocPlugin[];
  isProd?: boolean;
};

export async function modifyConfig(hookOptions: HookOptions) {
  const { config, docPlugins } = hookOptions;

  // config hooks
  for (const plugin of docPlugins) {
    if (typeof plugin.config === 'function') {
      config.doc = await plugin.config(config.doc || {});
    }
  }

  return config;
}

export async function beforeBuild(hookOptions: HookOptions) {
  const { config, docPlugins, isProd = true } = hookOptions;

  // beforeBuild hooks
  return await Promise.all(
    docPlugins
      .filter(plugin => typeof plugin.beforeBuild === 'function')
      .map(plugin => {
        return plugin.beforeBuild!(config.doc || {}, isProd);
      }),
  );
}

export async function afterBuild(hookOptions: HookOptions) {
  const { config, docPlugins, isProd = true } = hookOptions;

  // afterBuild hooks
  return await Promise.all(
    docPlugins
      .filter(plugin => typeof plugin.afterBuild === 'function')
      .map(plugin => {
        return plugin.afterBuild!(config.doc || {}, isProd);
      }),
  );
}
