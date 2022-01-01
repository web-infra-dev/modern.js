import { I18n } from '../src/index';

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
});
