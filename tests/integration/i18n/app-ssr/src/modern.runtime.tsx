import { defineRuntimeConfig } from '@modern-js/runtime';
import { i18next } from './i18n';

export default defineRuntimeConfig({
  i18n: {
    i18nInstance: i18next,
    initOptions: {
      debug: true,
    },
  },
});
