import { detectLanguageFromRequest } from '../src/shared/detection';

// A later English header must not override a supported query/cookie language.
const requests = [
  {
    source: 'query',
    url: '/?lng=zh-Hant-TW',
    headers: { 'accept-language': 'en' },
  },
  {
    source: 'cookie',
    url: '/',
    headers: { cookie: 'i18next=zh-Hant-TW', 'accept-language': 'en' },
  },
];

test.each(requests)('$source falls back to a supported base language', req => {
  expect(detectLanguageFromRequest(req, ['en', 'zh'])).toBe('zh');
});

test.each(requests)(
  '$source prefers the full tag when both are supported',
  req => {
    expect(detectLanguageFromRequest(req, ['en', 'zh', 'zh-Hant-TW'])).toBe(
      'zh-Hant-TW',
    );
  },
);

test('skips an unsupported query language and matches the cookie base language', () => {
  expect(
    detectLanguageFromRequest(
      { url: '/?lng=fr-FR', headers: { cookie: 'i18next=zh-CN' } },
      ['en', 'zh'],
    ),
  ).toBe('zh');
});
