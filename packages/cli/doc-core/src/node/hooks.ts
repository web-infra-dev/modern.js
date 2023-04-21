import { UserConfig, PageIndexInfo, DocPlugin } from 'shared/types';
import { pluginLastUpdated } from './plugins/lastUpdated';
import { AdditionalPage } from '@/shared/types/Plugin';

type HookOptions = {
  config: UserConfig;
  isProd?: boolean;
  pageData?: PageIndexInfo;
};

function getPlugins(config: UserConfig) {
  const plugins: DocPlugin[] = config.doc?.plugins || [];
  const enableLastUpdated =
    config.doc.themeConfig?.lastUpdated ||
    config.doc.themeConfig?.locales?.some(locale => locale.lastUpdated);
  if (enableLastUpdated) {
    plugins.push(pluginLastUpdated());
  }
  return plugins;
}

export async function modifyConfig(hookOptions: HookOptions) {
  const { config } = hookOptions;
  const docPlugins = getPlugins(config);

  // config hooks
  for (const plugin of docPlugins) {
    if (typeof plugin.config === 'function') {
      config.doc = await plugin.config(config.doc || {});
    }
  }

  return config;
}

export async function beforeBuild(hookOptions: HookOptions) {
  const { config, isProd = true } = hookOptions;
  const docPlugins = getPlugins(config);

  // beforeBuild hooks
  return await Promise.all(
    docPlugins
      .filter(plugin => typeof plugin.beforeBuild === 'function')
      .map(plugin => {
        return plugin.beforeBuild(config.doc || {}, isProd);
      }),
  );
}

export async function afterBuild(hookOptions: HookOptions) {
  const { config, isProd = true } = hookOptions;
  const docPlugins = getPlugins(config);

  // afterBuild hooks
  return await Promise.all(
    docPlugins
      .filter(plugin => typeof plugin.afterBuild === 'function')
      .map(plugin => {
        return plugin.afterBuild(config.doc || {}, isProd);
      }),
  );
}

export async function extendPageData(hookOptions: HookOptions): Promise<void> {
  const { pageData } = hookOptions;
  const docPlugins = getPlugins(hookOptions.config);
  // extendPageData hooks
  await Promise.all(
    docPlugins
      .filter(plugin => typeof plugin.extendPageData === 'function')
      .map(plugin => {
        return plugin.extendPageData(pageData);
      }),
  );
}

export async function addPages(
  hookOptions: HookOptions,
): Promise<AdditionalPage[]> {
  const { config } = hookOptions;
  const docPlugins = getPlugins(config);

  // addPages hooks
  const result = await Promise.all(
    docPlugins
      .filter(plugin => typeof plugin.addPages === 'function')
      .map(plugin => {
        return plugin.addPages(config.doc || {});
      }),
  );

  return result.flat();
}
