import { rstest } from '@rstest/core';
import i18next from 'i18next';
import { i18nPlugin, type I18nPluginOptions } from '../src/runtime';
import { initializeI18nInstance } from '../src/runtime/i18n/utils';

const environment = rstest.hoisted(() => ({ browser: false }));

rstest.mock('@modern-js/runtime', () => ({
  isBrowser: () => environment.browser,
}));
rstest.mock('@modern-js/runtime/context', () => ({
  InternalRuntimeContext: {},
}));
rstest.mock('@modern-js/runtime/router', () => ({}));
rstest.mock('@modern-js/runtime/head', () => ({ Helmet: () => null }));

const resources = {
  en: { translation: { greeting: 'Hello' } },
  fr: { translation: { greeting: 'Bonjour' } },
  zh: { translation: { greeting: '你好' } },
};

function setup(options: I18nPluginOptions = {}) {
  let beforeRender!: (context: any) => Promise<void>;
  i18nPlugin({
    localeDetection: {
      languages: ['en', 'fr', 'zh'],
      fallbackLanguage: 'zh',
      i18nextDetector: false,
      localePathRedirect: true,
    },
    initOptions: { resources },
    ...options,
  }).setup!({
    onBeforeRender: (hook: typeof beforeRender) => {
      beforeRender = hook;
    },
    getRuntimeConfig: () => ({}),
    wrapRoot: () => {},
    onDispose: () => {},
  } as any);
  return async (context: any = {}) => {
    context.isBrowser = environment.browser;
    await beforeRender(context);
    return context;
  };
}

beforeEach(() => {
  environment.browser = false;
});

afterEach(() => {
  rstest.unstubAllGlobals();
  rstest.useRealTimers();
});

test('cancels resource-store polling when initialization is disposed', async () => {
  rstest.useFakeTimers();
  const controller = new AbortController();
  const instance = {
    language: 'en',
    options: {},
    store: { data: {} },
    init: async () => {},
    use: () => {},
  };
  const initialization = initializeI18nInstance(
    instance,
    'en',
    'en',
    ['en'],
    {},
    {},
    {},
    undefined,
    controller.signal,
  );
  await Promise.resolve();
  await Promise.resolve();
  expect(rstest.getTimerCount()).toBe(1);
  const reason = new Error('Application disposed');
  const failure = expect(initialization).rejects.toBe(reason);
  controller.abort(reason);
  await failure;
  expect(rstest.getTimerCount()).toBe(0);
});

test('restores each browser instance language ahead of Host data and configured language', async () => {
  environment.browser = true;
  rstest.stubGlobal('window', {
    location: { pathname: '/zh/host' },
    _SSR_DATA: { data: { i18nData: { lng: 'zh' } } },
  });
  const render = setup({ initOptions: { lng: 'zh', resources } });
  const [english, french] = await Promise.all([
    render({ __i18nData__: { lng: 'en' } }),
    render({ __i18nData__: { lng: 'fr' } }),
  ]);

  expect(english.i18nInstance.language).toBe('en');
  expect(english.i18nInstance.t('greeting')).toBe('Hello');
  expect(french.i18nInstance.language).toBe('fr');
  expect(french.i18nInstance.t('greeting')).toBe('Bonjour');
  expect(english.i18nInstance).not.toBe(french.i18nInstance);
});

test('CSR without local SSR language never reads Host SSR data', async () => {
  environment.browser = true;
  const hostSSRData = rstest.fn(() => ({
    data: { i18nData: { lng: 'zh' } },
  }));
  rstest.stubGlobal('window', {
    location: { pathname: '/host' },
    get _SSR_DATA() {
      return hostSSRData();
    },
  });
  const context = await setup({
    localeDetection: {
      languages: ['en', 'zh'],
      fallbackLanguage: 'en',
      i18nextDetector: false,
    },
  })();

  expect(context.i18nInstance.language).toBe('en');
  expect(hostSSRData).not.toHaveBeenCalled();
});

test.each([
  { initialUrl: '/fr?tab=initial', basename: '/' },
  { initialUrl: '/mount/fr', basename: '/mount' },
  {
    initialUrl: '/mount/en',
    basename: '/mount',
    router: { state: { location: { pathname: '/MOUNT/fr' } } },
  },
])('detects the current application path for CSR: %j', async scope => {
  environment.browser = true;
  rstest.stubGlobal('window', {
    location: {
      pathname: '/zh/host',
      href: 'https://host.example/zh/host',
    },
  });
  const context = await setup()({
    application: { ...scope, output: 'fragment', entryPath: '' },
  });
  expect(context.i18nInstance.language).toBe('fr');
});

test.each([false, true])(
  'uses the current document entry path during initialization (browser: %s)',
  async browser => {
    environment.browser = browser;
    rstest.stubGlobal('window', {
      location: { pathname: '/workspace/account/fr' },
    });
    const context = await setup()({
      application: {
        output: 'document',
        definition: { basename: '/workspace/account' },
        initialUrl: 'https://app.example/workspace/account/fr',
      },
      ssrContext: { request: { pathname: '/workspace/account/fr' } },
    });
    expect(context.i18nInstance.language).toBe('fr');
  },
);

test('restores SSR language on an initialized browser instance without locale redirects', async () => {
  environment.browser = true;
  rstest.stubGlobal('window', { location: { pathname: '/host' } });
  const shared = i18next.createInstance();
  await shared.init({ lng: 'zh', resources });
  const context = await setup({
    i18nInstance: shared,
    localeDetection: {
      languages: ['en', 'zh'],
      fallbackLanguage: 'zh',
      i18nextDetector: false,
      localePathRedirect: false,
    },
  })({ __i18nData__: { lng: 'en' } });

  expect(context.i18nInstance).toBe(shared);
  expect(shared.language).toBe('en');
});

test('concurrent SSR initializes a shared user instance without a request language', async () => {
  const shared = i18next.createInstance();
  const changes: string[] = [];
  shared.on('languageChanged', language => changes.push(language));
  const render = setup({ i18nInstance: shared });
  const [english, french] = await Promise.all([
    render({ ssrContext: { request: { pathname: '/en' } } }),
    render({ ssrContext: { request: { pathname: '/fr' } } }),
  ]);

  expect(shared.language).toBe('zh');
  expect(changes).toEqual(['zh']);
  expect(english.i18nInstance).not.toBe(shared);
  expect(french.i18nInstance).not.toBe(english.i18nInstance);
  expect(english.i18nInstance.language).toBe('en');
  expect(french.i18nInstance.language).toBe('fr');
  expect(english.__i18nData__).toEqual({ lng: 'en' });
  expect(french.__i18nData__).toEqual({ lng: 'fr' });
  await english.changeLanguage('zh');
  expect(french.i18nInstance.t('greeting')).toBe('Bonjour');
});

test('SSR clones initialized user instances and preserves their shared resources', async () => {
  const shared = i18next.createInstance();
  await shared.init({ lng: 'zh', resources });
  const render = setup({ i18nInstance: shared });
  const english = await render({
    ssrContext: { request: { pathname: '/en' } },
  });
  const french = await render({
    ssrContext: { request: { pathname: '/fr' } },
  });

  expect(shared.language).toBe('zh');
  expect(english.i18nInstance.store).toBe(shared.store);
  expect(french.i18nInstance.store).toBe(shared.store);
  shared.addResourceBundle('en', 'translation', { shared: 'Shared' });
  expect(english.i18nInstance.t('shared')).toBe('Shared');
  expect(french.i18nInstance.t('greeting')).toBe('Bonjour');
});

test('SSR bootstraps and clones a custom wrapper without changing its request language', async () => {
  class Wrapper {
    readonly i18nInstance;
    constructor(instance = i18next.createInstance()) {
      this.i18nInstance = { instance };
    }
    get language() {
      return this.i18nInstance.instance.language;
    }
    use(plugin: any) {
      this.i18nInstance.instance.use(plugin);
      return this;
    }
    init(options?: any) {
      return this.i18nInstance.instance.init(options);
    }
    setLang(language: string) {
      return this.i18nInstance.instance.changeLanguage(language);
    }
    cloneInstance() {
      return new Wrapper(this.i18nInstance.instance.cloneInstance());
    }
  }
  const shared = new Wrapper();
  const render = setup({ i18nInstance: shared });
  const [english, french] = await Promise.all([
    render({ ssrContext: { request: { pathname: '/en' } } }),
    render({ ssrContext: { request: { pathname: '/fr' } } }),
  ]);

  expect(shared.language).toBe('zh');
  expect(english.i18nInstance).toBeInstanceOf(Wrapper);
  expect(english.i18nInstance.language).toBe('en');
  expect(french.i18nInstance.language).toBe('fr');
  expect(english.i18nInstance.i18nInstance.instance.t('greeting')).toBe(
    'Hello',
  );
  expect(french.i18nInstance.i18nInstance.instance.t('greeting')).toBe(
    'Bonjour',
  );
});

test('browser consumers keep an explicitly shared initialized instance', async () => {
  environment.browser = true;
  rstest.stubGlobal('window', { location: { pathname: '/en' } });
  const shared = i18next.createInstance();
  await shared.init({ lng: 'en', resources });
  const render = setup({ i18nInstance: shared });
  const first = await render();
  const second = await render();

  expect(first.i18nInstance).toBe(shared);
  expect(second.i18nInstance).toBe(shared);
  await first.changeLanguage('fr');
  expect(second.i18nInstance.t('greeting')).toBe('Bonjour');
});
