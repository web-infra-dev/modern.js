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
    return await Promise.all(
      this.#plugins
        .filter(plugin => typeof plugin.beforeBuild === 'function')
        .map(plugin => {
          return plugin.beforeBuild(this.#config.doc || {}, this.#isProd);
        }),
    );
  }

  async afterBuild() {
    return await Promise.all(
      this.#plugins
        .filter(plugin => typeof plugin.afterBuild === 'function')
        .map(plugin => {
          return plugin.afterBuild(this.#config.doc || {}, this.#isProd);
        }),
    );
  }

  async extendPageData(pageData: PageIndexInfo) {
    await Promise.all(
      this.#plugins
        .filter(plugin => typeof plugin.extendPageData === 'function')
        .map(plugin => {
          return plugin.extendPageData(pageData);
        }),
    );
  }

  async addPages(routes: RouteMeta[]) {
    // addPages hooks
    const result = await Promise.all(
      this.#plugins
        .filter(plugin => typeof plugin.addPages === 'function')
        .map(plugin => {
          return plugin.addPages(this.#config.doc || {}, this.#isProd, routes);
        }),
    );

    return result.flat();
  }

  async addSSGRoutes() {
    const result = await Promise.all(
      this.#plugins
        .filter(plugin => typeof plugin.addSSGRoutes === 'function')
        .map(plugin => {
          return plugin.addSSGRoutes(this.#config.doc || {}, this.#isProd);
        }),
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
}
