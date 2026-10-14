import i18next, {
  type Callback,
  type CloneOptions,
  type InitOptions,
  type i18n,
} from 'i18next';

// Keep the custom instance's initialization separate from the inner i18next.
// Initializing only the inner i18next must not enable the custom t() API.
class CustomI18nInstance {
  readonly i18nInstance: { instance: i18n; init: boolean };
  private readonly plugins: Parameters<i18n['use']>[0][] = [];

  constructor(instance = i18next.createInstance()) {
    this.i18nInstance = {
      instance,
      init: Boolean(instance.isInitialized),
    };
  }

  use(plugin: Parameters<i18n['use']>[0]) {
    if (!this.plugins.includes(plugin)) {
      this.plugins.push(plugin);
    }
    return this;
  }

  async init(options: InitOptions | Callback = {}, callback?: Callback) {
    const { instance } = this.i18nInstance;
    for (const plugin of this.plugins) {
      instance.use(plugin);
    }
    const config = typeof options === 'function' ? {} : options;
    const initCallback = typeof options === 'function' ? options : callback;
    const t = await instance.init(config, initCallback);
    this.i18nInstance.init = true;
    return { err: null, t };
  }

  get language() {
    return this.i18nInstance.instance.language;
  }

  t(key: string) {
    if (!this.i18nInstance.init) {
      return key;
    }
    return this.i18nInstance.instance.t(key);
  }

  async setLang(language: string) {
    await this.i18nInstance.instance.changeLanguage(language);
  }

  on(...args: Parameters<i18n['on']>) {
    this.i18nInstance.instance.on(...args);
    return this;
  }

  off(...args: Parameters<i18n['off']>) {
    this.i18nInstance.instance.off(...args);
    return this;
  }

  cloneInstance(options?: CloneOptions) {
    const instance = this.i18nInstance.instance.cloneInstance(options);
    const customInstance = new CustomI18nInstance(instance);
    for (const plugin of this.plugins) {
      customInstance.use(plugin);
    }
    return customInstance;
  }
}

export function createCustomI18nInstance() {
  return new CustomI18nInstance();
}
