import i18next from 'i18next';

export function createStarlingWrapper() {
  const inner = i18next.createInstance();

  const wrapper = {
    i18nInstance: inner,
    plugins: [] as any[],
    ignoreWarning: false,
    init: async (config?: any, callback?: any) => {
      const result = await inner.init(config, callback);
      return { err: null, t: inner.t.bind(inner), ...result };
    },
    use(plugin: any) {
      if (!plugin) {
        return this;
      }
      if (typeof plugin.init === 'function') {
        plugin.init(inner);
      }
      this.plugins.push(plugin);
      inner.use(plugin);
      return this;
    },
    setLang(lng: string) {
      if (typeof inner.changeLanguage === 'function') {
        return inner.changeLanguage(lng);
      }
      return Promise.resolve();
    },
    changeLanguage(lng: string) {
      return inner.changeLanguage(lng);
    },
    get language() {
      return inner.language;
    },
    get languages() {
      return inner.languages;
    },
    t(...args: any[]) {
      return inner.t.apply(inner, args as any);
    },
    // 事件系统：转发到内部的 i18next 实例
    on(event: string, callback: (...args: any[]) => void) {
      if (typeof inner.on === 'function') {
        inner.on(event, callback);
      }
      return this;
    },
    off(event: string, callback?: (...args: any[]) => void) {
      if (typeof inner.off === 'function') {
        inner.off(event, callback);
      }
      return this;
    },
    emit(event: string, ...args: any[]) {
      if (typeof inner.emit === 'function') {
        inner.emit(event, ...args);
      }
      return this;
    },
    // 其他可能需要的属性
    get isInitialized() {
      return inner.isInitialized;
    },
    get options() {
      return inner.options;
    },
    get store() {
      return inner.store;
    },
    get services() {
      return inner.services;
    },
    reloadResources(lng?: string, ns?: string) {
      if (typeof inner.reloadResources === 'function') {
        return inner.reloadResources(lng, ns);
      }
      return Promise.resolve();
    },
    cloneInstance(opts?: any) {
      const cloned = inner.cloneInstance(opts);
      const clonedWrapper = createStarlingWrapper();
      clonedWrapper.i18nInstance = cloned;
      clonedWrapper.plugins = [...this.plugins];
      clonedWrapper.plugins.forEach((plugin: any) => {
        if (typeof plugin.init === 'function') {
          plugin.init(cloned);
        }
      });
      return clonedWrapper;
    },
  } as any;

  return wrapper;
}
