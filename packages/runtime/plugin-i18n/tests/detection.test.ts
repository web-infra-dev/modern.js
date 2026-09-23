import { detectLanguageFromRequest } from '../src/shared/detection';

describe('request language matching', () => {
  const requests = [
    { source: 'querystring', url: '/?lng=zh-Hant-TW', headers: {} },
    { source: 'cookie', url: '/', headers: { cookie: 'i18next=zh-Hant-TW' } },
    {
      source: 'header',
      url: '/',
      headers: { 'accept-language': 'zh-Hant-TW' },
    },
  ];

  test.each(requests)(
    '$source falls back to the supported base language',
    req => {
      expect(detectLanguageFromRequest(req, ['en', 'zh'])).toBe('zh');
    },
  );

  test.each(requests)('$source prefers the supported full tag', req => {
    expect(detectLanguageFromRequest(req, ['en', 'zh', 'zh-Hant-TW'])).toBe(
      'zh-Hant-TW',
    );
  });

  test.each(requests)(
    '$source preserves the tag without a language allowlist',
    req => {
      expect(detectLanguageFromRequest(req, [])).toBe('zh-Hant-TW');
    },
  );

  test.each(requests)('$source rejects an unsupported language', req => {
    expect(detectLanguageFromRequest(req, ['en'])).toBeNull();
  });

  test('continues to the next source when the language is unsupported', () => {
    expect(
      detectLanguageFromRequest(
        { url: '/?lng=fr-FR', headers: { cookie: 'i18next=zh-CN' } },
        ['en', 'zh'],
      ),
    ).toBe('zh');
  });

  test('respects source priority when a base language matches', () => {
    expect(
      detectLanguageFromRequest(
        { url: '/?lng=zh-CN', headers: { cookie: 'i18next=en' } },
        ['en', 'zh'],
      ),
    ).toBe('zh');
  });
});
