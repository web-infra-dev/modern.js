/** @rstest-environment happy-dom */
import { rstest } from '@rstest/core';
import i18next from 'i18next';
import { act, createElement } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { useClientSideRedirect, useLanguageSync } from '../src/runtime/hooks';

const router = rstest.hoisted(() => ({
  navigate: rstest.fn(),
  location: { pathname: '/start', search: '?tab=details', hash: '#summary' },
}));

rstest.mock('@modern-js/runtime', () => ({ isBrowser: () => true }));
rstest.mock('@modern-js/runtime/context', () => ({
  getGlobalBasename: () => '/host-entry',
}));
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
      _routeScope: { initialUrl: '/start', basename: '/' },
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
    _routeScope: {
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
