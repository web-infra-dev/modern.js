import { UserConfig, PageIndexInfo, DocPlugin } from 'shared/types';
import { pluginLastUpdated } from './plugins/lastUpdated';
import { AdditionRoute } from '@/shared/types/Plugin';

type HookOptions = {
  config: UserConfig;
  isProd?: boolean;
  pageData?: PageIndexInfo;
};

const DEFAULT_PLUGINS = [pluginLastUpdated() as DocPlugin];

function getPlugins(config: UserConfig) {
  const plugins = config.doc?.plugins || [];
  return [...DEFAULT_PLUGINS, ...plugins];
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

export async function addRoutes(
  hookOptions: HookOptions,
): Promise<AdditionRoute[]> {
  const { config } = hookOptions;
  const docPlugins = getPlugins(config);

  // addRoutes hooks
  const result = await Promise.all(
    docPlugins
      .filter(plugin => typeof plugin.addRoutes === 'function')
      .map(plugin => {
        return plugin.addRoutes(config.doc || {});
      }),
  );

  return result.flat();
}
