import i18next from 'i18next';
import { readLanguageFromStorage as readBrowserLanguageFromStorage } from '../src/runtime/i18n/detection/middleware';
import {
  detectLanguage as detectNodeLanguage,
  readLanguageFromStorage as readNodeLanguageFromStorage,
  useI18nextLanguageDetector,
} from '../src/runtime/i18n/detection/middleware.node';

const detectionOptions = {
  order: ['querystring', 'cookie', 'header'],
  lookupQuerystring: 'lng',
  lookupCookie: 'i18next',
  lookupHeader: 'accept-language',
};

const createSsrContext = (
  url: string,
  headers: Record<string, string> = {},
): {
  request: {
    url: string;
    headers: Record<string, string | undefined>;
    raw: Request;
  };
} => {
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has('host')) {
    requestHeaders.set('host', 'localhost');
  }

  return {
    request: {
      url,
      headers: Object.fromEntries(requestHeaders.entries()),
      raw: new Request(url, {
        headers: requestHeaders,
      }),
    },
  };
};

describe('i18n language detection', () => {
  const windowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'window',
  );

  afterEach(() => {
    if (windowDescriptor) {
      Object.defineProperty(globalThis, 'window', windowDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, 'window');
    }
  });

  test('wrapper SSR querystring detection uses request.raw from the SSR context', () => {
    const ssrContext = createSsrContext('http://localhost/?lng=zh');

    expect(
      readNodeLanguageFromStorage(detectionOptions, ssrContext.request as any),
    ).toBeUndefined();
    expect(
      readNodeLanguageFromStorage(detectionOptions, ssrContext.request.raw),
    ).toBe('zh');
  });

  test('wrapper SSR cookie detection uses request.raw from the SSR context', () => {
    const ssrContext = createSsrContext('http://localhost/', {
      cookie: 'i18next=zh',
    });

    expect(
      readNodeLanguageFromStorage(detectionOptions, ssrContext.request as any),
    ).toBeUndefined();
    expect(
      readNodeLanguageFromStorage(detectionOptions, ssrContext.request.raw),
    ).toBe('zh');
  });

  test('wrapper SSR accept-language detection uses request.raw from the SSR context', () => {
    const ssrContext = createSsrContext('http://localhost/', {
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
    });

    expect(
      readNodeLanguageFromStorage(detectionOptions, ssrContext.request as any),
    ).toBeUndefined();
    expect(
      readNodeLanguageFromStorage(detectionOptions, ssrContext.request.raw),
    ).toBe('zh');
  });

  test('keeps the non-wrapper SSR detector path working', async () => {
    const i18nInstance = i18next.createInstance();
    useI18nextLanguageDetector(i18nInstance as any);
    await i18nInstance.init({
      initImmediate: false,
      fallbackLng: 'en',
      supportedLngs: ['en', 'zh'],
      detection: detectionOptions,
    } as any);

    expect(
      detectNodeLanguage(
        i18nInstance as any,
        createSsrContext('http://localhost/?lng=zh').request,
        detectionOptions,
      ),
    ).toBe('zh');
  });

  test('keeps browser wrapper querystring detection priority unchanged', () => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        name: '',
        location: {
          search: '?lng=zh',
        },
        _SSR_DATA: undefined,
      },
    });

    expect(
      readBrowserLanguageFromStorage(
        detectionOptions,
        new Request('http://localhost/'),
      ),
    ).toBe('zh');
  });
});
