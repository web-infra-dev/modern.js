/** @rstest-environment happy-dom */
import { rstest } from '@rstest/core';
import i18next from 'i18next';
import { act, createElement } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { InternalRuntimeContext } from '@modern-js/runtime/context';
import {
  useClientSideRedirect,
  useLanguageSync,
  useSdkResourcesLoader,
} from '../src/runtime/hooks';
import { ModernI18nProvider, useModernI18n } from '../src/runtime/context';
import {
  I18N_SDK_RESOURCES_LOADED_EVENT,
  setI18nSdkBackendId,
} from '../src/runtime/i18n/backend/sdk-event';

const router = rstest.hoisted(() => ({
  navigate: rstest.fn(),
  location: { pathname: '/start', search: '?tab=details', hash: '#summary' },
}));

rstest.mock('@modern-js/runtime', () => ({ isBrowser: () => true }));
const runtime = rstest.hoisted(() => ({
  InternalRuntimeContext: require('react').createContext({}),
}));
rstest.mock('@modern-js/runtime/context', () => runtime);
rstest.mock('@modern-js/runtime/router', () => ({
  useNavigate: () => router.navigate,
  useLocation: () => router.location,
  useParams: () => ({}),
}));

let root: Root;
beforeEach(() => {
  rstest.stubEnv('MODERN_TARGET', 'browser');
  rstest.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.history.replaceState(null, '', '/zh/host');
  router.navigate.mockClear();
  router.location = {
    pathname: '/start',
    search: '?tab=details',
    hash: '#summary',
  };
  const element = document.createElement('div');
  document.body.appendChild(element);
  root = createRoot(element);
});
afterEach(async () => {
  await act(() => root.unmount());
  document.body.innerHTML = '';
  delete (window as any)._SSR_DATA;
  rstest.unstubAllEnvs();
  rstest.unstubAllGlobals();
  rstest.useRealTimers();
});

test.each([false, true])(
  'locale redirect uses local SSR presence (%s) even with Host SSR data',
  async localSSR => {
    const hostDataRead = rstest.fn(() => ({
      data: { i18nData: { lng: 'zh' } },
    }));
    Object.defineProperty(window, '_SSR_DATA', {
      configurable: true,
      get: hostDataRead,
    });
    const instance = i18next.createInstance();
    await instance.init({ lng: 'en', resources: {} });
    const context = {
      isBrowser: true,
      application: {
        output: 'fragment',
        entryPath: '',
        initialUrl: '/start',
        basename: '/',
      },
      __i18nData__: localSSR ? { lng: 'en' } : undefined,
    };
    function App() {
      useClientSideRedirect(
        instance,
        true,
        ['en', 'zh'],
        'en',
        undefined,
        context as any,
      );
      return null;
    }
    await act(() => root.render(createElement(App)));

    expect(hostDataRead).not.toHaveBeenCalled();
    if (localSSR) {
      expect(router.navigate).not.toHaveBeenCalled();
    } else {
      expect(router.navigate).toHaveBeenCalledWith(
        '/en/start?tab=details#summary',
        { replace: true },
      );
    }
  },
);

test('language synchronization keeps the scoped route language after hydration', async () => {
  const instance = i18next.createInstance();
  await instance.init({ lng: 'fr', resources: {} });
  const changeLanguage = rstest.spyOn(instance, 'changeLanguage');
  const setLanguage = rstest.fn();
  const context = {
    isBrowser: true,
    application: {
      output: 'fragment',
      entryPath: '',
      initialUrl: '/mount/fr',
      basename: '/mount',
      router: { state: { location: { pathname: '/mount/fr' } } },
    },
    __i18nData__: { lng: 'fr' },
  };
  function App() {
    useLanguageSync(
      instance,
      true,
      ['en', 'fr', 'zh'],
      { current: context as any },
      { current: 'fr' },
      setLanguage,
    );
    return null;
  }
  await act(() => root.render(createElement(App)));

  expect(instance.language).toBe('fr');
  expect(changeLanguage).not.toHaveBeenCalled();
  expect(setLanguage).not.toHaveBeenCalled();
});

test.each([
  {
    output: 'document',
    entryPath: '/workspace/account',
    pathname: '/workspace/account/en',
  },
  { output: 'fragment', entryPath: '', pathname: '/en' },
])(
  'changes language using this application entry path: %j',
  async application => {
    const instance = i18next.createInstance();
    await instance.init({ lng: 'en', resources: {} });
    router.location.pathname = application.pathname;
    let changeLanguage!: (language: string) => Promise<void>;
    function App() {
      changeLanguage = useModernI18n().changeLanguage;
      return null;
    }
    await act(() =>
      root.render(
        createElement(InternalRuntimeContext.Provider, {
          value: { isBrowser: true, application } as any,
          children: createElement(ModernI18nProvider, {
            value: {
              language: 'en',
              i18nInstance: instance,
              languages: ['en', 'fr'],
              localePathRedirect: true,
            },
            children: createElement(App),
          }),
        }),
      ),
    );
    await act(() => changeLanguage('fr'));
    expect(router.navigate).toHaveBeenCalledWith(
      `${application.entryPath}/fr?tab=details#summary`,
      { replace: true },
    );
  },
);

test('clears SDK retries and its event listener when the application unmounts', async () => {
  rstest.useFakeTimers();
  const store = { data: {} };
  setI18nSdkBackendId(store, 'local-backend');
  const instance = { store, emit: rstest.fn() } as any;
  const update = rstest.fn();
  function App() {
    useSdkResourcesLoader(instance, update);
    return null;
  }
  await act(() => root.render(createElement(App)));
  const loaded = () =>
    window.dispatchEvent(
      new CustomEvent(I18N_SDK_RESOURCES_LOADED_EVENT, {
        detail: {
          language: 'en',
          namespace: 'translation',
          backendId: 'local-backend',
        },
      }),
    );
  loaded();
  expect(rstest.getTimerCount()).toBe(1);
  await act(() => root.render(null));
  expect(rstest.getTimerCount()).toBe(0);
  loaded();
  await rstest.runAllTimersAsync();
  expect(instance.emit).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

test('ignores SDK reload completion after the application unmounts', async () => {
  let finish!: () => void;
  const store = { data: { en: { translation: { message: 'Hello' } } } };
  setI18nSdkBackendId(store, 'local-backend');
  const instance = {
    store,
    emit: rstest.fn(),
    reloadResources: () =>
      new Promise<void>(resolve => {
        finish = resolve;
      }),
  } as any;
  const update = rstest.fn();
  function App() {
    useSdkResourcesLoader(instance, update);
    return null;
  }
  await act(() => root.render(createElement(App)));
  window.dispatchEvent(
    new CustomEvent(I18N_SDK_RESOURCES_LOADED_EVENT, {
      detail: {
        language: 'en',
        namespace: 'translation',
        backendId: 'local-backend',
      },
    }),
  );
  const emissions = instance.emit.mock.calls.length;
  const updates = update.mock.calls.length;
  await act(() => root.render(null));
  await act(async () => {
    finish();
  });
  expect(instance.emit).toHaveBeenCalledTimes(emissions);
  expect(update).toHaveBeenCalledTimes(updates);
});
