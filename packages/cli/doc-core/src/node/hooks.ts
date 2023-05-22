import { UserConfig, PageIndexInfo, DocPlugin } from 'shared/types';
import { AdditionalPage } from '@/shared/types/Plugin';

type HookOptions = {
  config: UserConfig;
  isProd?: boolean;
  pageData?: PageIndexInfo;
};

let docPlugins: DocPlugin[] = [];

// The init function is used to initialize the doc plugins and will execute before the build process.
export async function loadPlugins(config: UserConfig) {
  // Clear docPlugins first, for the watch mode
  docPlugins = [];
  const enableLastUpdated =
    config.doc.themeConfig?.lastUpdated ||
    config.doc.themeConfig?.locales?.some(locale => locale.lastUpdated);
  const mediumZoomConfig = config.doc.mediumZoom ?? true;
  if (enableLastUpdated) {
    const { pluginLastUpdated } = await import('./plugins/lastUpdated');
    docPlugins.push(pluginLastUpdated());
  }
  if (mediumZoomConfig) {
    const { pluginMediumZoom } = await import(
      '@modern-js/doc-plugin-medium-zoom'
    );
    docPlugins.push(
      pluginMediumZoom(
        typeof mediumZoomConfig === 'object' ? mediumZoomConfig : undefined,
      ),
    );
  }
  docPlugins.push(...(config.doc.plugins || []));
}

export async function modifyConfig(hookOptions: HookOptions) {
  const { config } = hookOptions;

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

export async function globalUIComponents(): Promise<string[]> {
  // globalUIComponents hooks
  const result = docPlugins.map(plugin => {
    return plugin.globalUIComponents || [];
  });

  return result.flat();
}

export async function globalStyles(): Promise<string[]> {
  // globalStyles hooks
  const result = docPlugins
    .filter(plugin => typeof plugin.globalStyles === 'string')
    .map(plugin => {
      return plugin.globalStyles;
    });

  return result;
}
