import type {
  I18nSdkLoadOptions,
  I18nSdkLoader,
  Resources,
} from '@modern-js/plugin-i18n/runtime';

/**
 * Mock SDK loader for testing
 * Simulates loading i18n resources from an external SDK
 */
export const createMockSdkLoader = (): I18nSdkLoader => {
  const mockResources: Resources = {
    en: {
      translation: {
        key: 'Hello World',
        about: 'About',
      },
    },
    zh: {
      translation: {
        key: '你好，世界',
        about: '关于',
      },
    },
  };

  return async (options: I18nSdkLoadOptions): Promise<Resources> => {
    console.log('mock sdk loader');
    await new Promise(resolve => setTimeout(resolve, 10));

    if (options.all || (!options.lng && !options.lngs)) {
      return mockResources;
    }

    if (options.lngs) {
      const namespaces = options.nss || [options.ns || 'translation'];
      const result: Resources = {};
      for (const lng of options.lngs) {
        result[lng] = {};
        for (const ns of namespaces) {
          result[lng][ns] = mockResources[lng]?.[ns] || {};
        }
      }
      return result;
    }

    const lng = options.lng || 'en';
    const namespaces = options.nss || [options.ns || 'translation'];
    const result: Resources = {
      [lng]: {},
    };
    for (const ns of namespaces) {
      result[lng][ns] = mockResources[lng]?.[ns] || {};
    }
    return result;
  };
};
