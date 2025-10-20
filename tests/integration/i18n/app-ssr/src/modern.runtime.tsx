import { defineRuntimeConfig } from '@modern-js/runtime';
import { i18next } from './i18n';

export default defineRuntimeConfig({
  i18n: {
    i18nInstance: i18next,
    initOptions: {
      resources: {
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
      },
    },
  },
});
