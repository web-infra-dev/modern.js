rstest.mock('@modern-js/runtime', () => ({
  isBrowser: () => true,
}));

import { readLanguageFromStorage } from '../../../../src/runtime/i18n/detection/middleware';

describe('middleware browser readLanguageFromStorage', () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalNavigator = globalThis.navigator;
  const originalLocalStorage = globalThis.localStorage;

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      writable: true,
      value: originalDocument,
    });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      writable: true,
      value: originalNavigator,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: originalLocalStorage,
    });
  });

  test('should keep browser querystring detection behavior', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: {
        location: {
          search: '?lng=zh',
        },
      },
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      writable: true,
      value: {
        cookie: '',
        documentElement: { lang: '' },
      },
    });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      writable: true,
      value: {
        language: 'en-US',
      },
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: {
        getItem: () => null,
      },
    });

    const language = readLanguageFromStorage(
      { order: ['querystring', 'cookie'] },
      { request: 'unused-in-browser' },
    );

    expect(language).toBe('zh');
  });
});
