rstest.mock('@modern-js/runtime', () => ({
  isBrowser: () => false,
}));

rstest.mock('@modern-js/runtime/context', () => ({
  getGlobalBasename: () => '',
}));

rstest.mock('../../../../src/runtime/i18n/detection/middleware', () => ({
  cacheUserLanguage: rstest.fn(),
  detectLanguage: rstest.fn(),
  readLanguageFromStorage: rstest.fn(),
  useI18nextLanguageDetector: rstest.fn(),
}));

import { detectLanguageWithPriority } from '../../../../src/runtime/i18n/detection/index';
import * as middleware from '../../../../src/runtime/i18n/detection/middleware';

describe('detectLanguageWithPriority', () => {
  const readLanguageFromStorageMock = middleware.readLanguageFromStorage as any;
  const detectLanguageMock = middleware.detectLanguage as any;

  beforeEach(() => {
    readLanguageFromStorageMock.mockReset();
    detectLanguageMock.mockReset();
  });

  test('should pass ssr request to wrapper storage detection', async () => {
    readLanguageFromStorageMock.mockReturnValue('zh');
    const request = new Request('https://modernjs.dev/?lng=zh');
    const wrapperInstance = {
      i18nInstance: { instance: {} },
      init: async () => undefined,
      use() {
        return this;
      },
    };

    const result = await detectLanguageWithPriority(
      wrapperInstance as any,
      {
        languages: ['en', 'zh'],
        fallbackLanguage: 'en',
        localePathRedirect: false,
        i18nextDetector: true,
        pathname: '/',
        ssrContext: { request },
      } as any,
    );

    expect(readLanguageFromStorageMock).toHaveBeenCalledWith(
      expect.any(Object),
      request,
    );
    expect(result.detectedLanguage).toBe('zh');
    expect(result.finalLanguage).toBe('zh');
  });

  test('should keep standard i18next detector behavior for non-wrapper', async () => {
    detectLanguageMock.mockReturnValue('zh-CN');
    const i18nInstance = {
      isInitialized: false,
      use() {
        return this;
      },
      init: async () => undefined,
      services: {},
      options: {},
    };

    const result = await detectLanguageWithPriority(
      i18nInstance as any,
      {
        languages: ['en', 'zh'],
        fallbackLanguage: 'en',
        localePathRedirect: false,
        i18nextDetector: true,
        pathname: '/',
        ssrContext: { request: new Request('https://modernjs.dev/') },
      } as any,
    );

    expect(readLanguageFromStorageMock).not.toHaveBeenCalled();
    expect(detectLanguageMock).toHaveBeenCalled();
    expect(result.detectedLanguage).toBe('zh');
    expect(result.finalLanguage).toBe('zh');
  });
});
