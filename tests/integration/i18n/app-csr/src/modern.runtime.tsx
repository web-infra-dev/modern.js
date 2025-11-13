import { defineRuntimeConfig } from '@modern-js/runtime';
import i18next from 'i18next';

export default defineRuntimeConfig({
  i18n: {
    i18nInstance: i18next,
    initOptions: {
      fallbackLng: 'en',
      supportedLngs: ['zh', 'en'],
    },
  },
});
