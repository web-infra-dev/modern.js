import type { Resources } from '@modern-js/plugin-i18n/runtime';

const baseResources: Resources = {
  en: {
    translation: {
      key: 'Hello World from SDK',
      about: 'About page from SDK',
    },
  },
  zh: {
    translation: {
      key: '你好，世界（SDK）',
      about: '关于（SDK）',
    },
  },
};

export function createMockSdkLoader() {
  return async (_options: any): Promise<Resources> => {
    console.log('mock sdk loader: fetching resources');
    await new Promise(resolve => setTimeout(resolve, 100));
    return baseResources;
  };
}
