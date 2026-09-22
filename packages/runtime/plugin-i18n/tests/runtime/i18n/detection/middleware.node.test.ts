import { readLanguageFromStorage } from '../../../../src/runtime/i18n/detection/middleware.node';

describe('middleware.node readLanguageFromStorage', () => {
  test('should detect language from querystring in SSR request', () => {
    const request = new Request('https://modernjs.dev/?lng=zh');
    const language = readLanguageFromStorage(
      {
        order: ['querystring', 'cookie', 'header'],
        lookupQuerystring: 'lng',
      },
      request,
    );

    expect(language).toBe('zh');
  });

  test('should detect language from cookie in SSR request', () => {
    const request = new Request('https://modernjs.dev/', {
      headers: {
        cookie: 'my-lng=zh-CN; i18next=en',
      },
    });
    const language = readLanguageFromStorage(
      {
        order: ['cookie', 'header'],
        lookupCookie: 'my-lng',
      },
      request,
    );

    expect(language).toBe('zh-CN');
  });

  test('should detect language from header in SSR request', () => {
    const request = new Request('https://modernjs.dev/', {
      headers: {
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    });
    const language = readLanguageFromStorage(
      {
        order: ['header'],
        lookupHeader: 'accept-language',
      },
      request,
    );

    expect(language).toBe('zh');
  });
});
