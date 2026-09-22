import { expect, test } from '@rstest/core';
import i18next from 'i18next';
import { detectLanguage } from '../src/runtime/i18n/detection/middleware.node';

test.each(['i18next', 'custom instance'])(
  'detects request language for initialized %s without a registered detector',
  async kind => {
    const actualInstance = i18next.createInstance();
    const instance =
      kind === 'i18next'
        ? actualInstance
        : {
            i18nInstance: { instance: actualInstance },
            init: actualInstance.init.bind(actualInstance),
            use: actualInstance.use.bind(actualInstance),
            get language() {
              return actualInstance.language;
            },
          };

    await instance.init({
      lng: 'en',
      fallbackLng: 'en',
      supportedLngs: ['en', 'zh-Hant-TW'],
      resources: {},
    });
    expect(actualInstance.isInitialized).toBe(true);
    expect(actualInstance.services.languageDetector).toBeUndefined();

    expect(
      detectLanguage(instance, {
        query: { lng: 'zh-Hant-TW' },
        cookies: {},
        headers: {},
      }),
    ).toBe('zh-Hant-TW');
  },
);
