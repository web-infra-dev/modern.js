import { UserConfig, PageIndexInfo, DocPlugin, RouteMeta } from 'shared/types';
import { pluginAutoNavSidebar } from './plugins/autoNavAndSidebar';

export class PluginDriver {
  #config: UserConfig;

  #plugins: DocPlugin[];

  #isProd: boolean;

  constructor(config: UserConfig, isProd: boolean) {
    this.#config = config;
    this.#isProd = isProd;
  }

  // The init function is used to initialize the doc plugins and will execute before the build process.
  async init() {
    // Clear docPlugins first, for the watch mode
    this.clearPlugins();
    const config = this.#config;
    const themeConfig = config.doc.themeConfig || {};
    const enableLastUpdated =
      themeConfig?.lastUpdated ||
      themeConfig?.locales?.some(locale => locale.lastUpdated);
    const mediumZoomConfig = config.doc.mediumZoom ?? true;
    const haveNavSidebarConfig =
      themeConfig.nav ||
      themeConfig.sidebar ||
      themeConfig.locales?.[0].nav ||
      themeConfig.locales?.[0].sidebar;
    if (enableLastUpdated) {
      const { pluginLastUpdated } = await import('./plugins/lastUpdated');
      this.addPlugin(pluginLastUpdated());
    }
    if (mediumZoomConfig) {
      const { pluginMediumZoom } = await import(
        '@modern-js/doc-plugin-medium-zoom'
      );
      this.addPlugin(
        pluginMediumZoom(
          typeof mediumZoomConfig === 'object' ? mediumZoomConfig : undefined,
        ),
      );
    }
    if (!haveNavSidebarConfig) {
      this.addPlugin(pluginAutoNavSidebar());
    }

    (config.doc.plugins || []).forEach(plugin => {
      this.addPlugin(plugin);
    });
  }

  addPlugin(plugin: DocPlugin) {
    const exsitedIndex = this.#plugins.findIndex(
      item => item.name === plugin.name,
    );
    // Avoid the duplicated plugin
    if (exsitedIndex !== -1) {
      throw new Error(`The plugin "${plugin.name}" has been registered`);
    } else {
      this.#plugins.push(plugin);
    }
  }

  clearPlugins() {
    this.#plugins = [];
  }

  async modifyConfig() {
    let config = this.#config.doc;

    for (const plugin of this.#plugins) {
      if (typeof plugin.config === 'function') {
        config = await plugin.config(config || {});
      }
    }
    this.#config.doc = config;
    return this.#config;
  }

  async beforeBuild() {
    return this._runParallelAsyncHook(
      'beforeBuild',
      this.#config.doc || {},
      this.#isProd,
    );
  }

  async afterBuild() {
    return this._runParallelAsyncHook(
      'afterBuild',
      this.#config.doc || {},
      this.#isProd,
    );
  }

  async modifySearchIndexData(
    pages: PageIndexInfo[],
  ): Promise<PageIndexInfo[]> {
    return this._runParallelAsyncHook('modifySearchIndexData', pages);
  }

  async extendPageData(pageData: PageIndexInfo) {
    return this._runParallelAsyncHook('extendPageData', pageData);
  }

  async addPages() {
    // addPages hooks
    const result = await this._runParallelAsyncHook(
      'addPages',
      this.#config.doc || {},
      this.#isProd,
    );
    return result.flat();
  }

  async routeGenerated(routes: RouteMeta[]) {
    return this._runParallelAsyncHook('routeGenerated', routes);
  }

  async addSSGRoutes() {
    const result = await this._runParallelAsyncHook(
      'addSSGRoutes',
      this.#config.doc || {},
      this.#isProd,
    );

    return result.flat();
  }

  globalUIComponents(): string[] {
    const result = this.#plugins.map(plugin => {
      return plugin.globalUIComponents || [];
    });

    return result.flat();
  }

  globalStyles(): string[] {
    return this.#plugins
      .filter(plugin => typeof plugin.globalStyles === 'string')
      .map(plugin => {
        return plugin.globalStyles;
      });
  }

  _runParallelAsyncHook(hookName: string, ...args: unknown[]) {
    return Promise.all(
      this.#plugins
        .filter(plugin => typeof plugin[hookName] === 'function')
        .map(plugin => {
          return plugin[hookName](...args);
        }),
    );
  }

  _runSerialAysncHook(hookName: string, ...args: unknown[]) {
    return this.#plugins.reduce(async (prev, plugin) => {
      if (typeof plugin[hookName] === 'function') {
        await prev;
        return plugin[hookName](...args);
      }
      return prev;
    }, Promise.resolve());
  }
}
