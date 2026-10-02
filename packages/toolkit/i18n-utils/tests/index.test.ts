import { I18n } from '../src';
import { getLocaleLanguage } from '../src/languageDetector';

describe('i18n test', () => {
  test('Init Default language', () => {
    const i18n = new I18n();
    const EN_LANGUAGE = {
      lib_name: 'Library',
      test_name: 'test {name}',
    };

    const ZH_LANGUAGE = {
      lib_name: '工具库',
      test_name: '测试 {name}',
    };
    const languageKeys = i18n.init('en', { en: EN_LANGUAGE, zh: ZH_LANGUAGE });
    expect(i18n.t(languageKeys.lib_name)).toBe(EN_LANGUAGE.lib_name);
    expect(i18n.t(languageKeys.test_name, { name: 'library' })).toBe(
      'test library',
    );
  });
  test('Change language', () => {
    const i18n = new I18n();
    const EN_LANGUAGE = {
      lib_name: 'Library',
      test_name: 'test {name}',
    };

    const ZH_LANGUAGE = {
      lib_name: '工具库',
      test_name: '测试 {name}',
    };
    const languageKeys = i18n.init('en', { en: EN_LANGUAGE, zh: ZH_LANGUAGE });
    i18n.changeLanguage({
      locale: 'zh',
    });
    expect(i18n.t(languageKeys.lib_name)).toBe(ZH_LANGUAGE.lib_name);
    expect(i18n.t(languageKeys.test_name, { name: 'library' })).toBe(
      '测试 library',
    );
  });
  test('Use object in language resource', () => {
    const i18n = new I18n();
    const EN_LANGUAGE = {
      name: {
        lib_name: 'Library',
        test_name: 'test {name}',
      },
    };

    const ZH_LANGUAGE = {
      name: {
        lib_name: '工具库',
        test_name: '测试 {name}',
      },
    };
    const languageKeys = i18n.init('en', { en: EN_LANGUAGE, zh: ZH_LANGUAGE });
    i18n.changeLanguage({
      locale: 'zh',
    });
    expect(i18n.t(languageKeys.name.lib_name)).toBe(ZH_LANGUAGE.name.lib_name);
    expect(i18n.t(languageKeys.name.test_name, { name: 'library' })).toBe(
      '测试 library',
    );
  });
  test('Get language real time', () => {
    const i18n = new I18n();
    const EN_LANGUAGE = {
      name: {
        lib_name: 'Library',
        test_name: 'test {name}',
      },
    };

    const ZH_LANGUAGE = {
      name: {
        lib_name: '工具库',
        test_name: '测试 {name}',
      },
    };
    const keys = i18n.init('en', { en: EN_LANGUAGE, zh: ZH_LANGUAGE });
    expect(i18n.lang('zh').t(keys.name.lib_name)).toBe('工具库');
  });

  test('Detect language without process', () => {
    const processDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'process',
    );
    const dateTimeFormatDescriptor = Object.getOwnPropertyDescriptor(
      Intl,
      'DateTimeFormat',
    );
    let language = '';

    try {
      Reflect.deleteProperty(globalThis, 'process');
      Object.defineProperty(Intl, 'DateTimeFormat', {
        configurable: true,
        value: () => ({
          resolvedOptions: () => ({ locale: 'fr-FR' }),
        }),
      });

      language = getLocaleLanguage();
    } finally {
      if (processDescriptor) {
        Object.defineProperty(globalThis, 'process', processDescriptor);
      }
      if (dateTimeFormatDescriptor) {
        Object.defineProperty(Intl, 'DateTimeFormat', dateTimeFormatDescriptor);
      }
    }

    expect(language).toBe('fr');
  });
});
