import { defineRuntimeConfig } from '@modern-js/runtime';
import i18next from 'i18next';
import { createMockSdkLoader } from './mock-sdk';

export default defineRuntimeConfig({
  i18n: {
    i18nInstance: i18next,
    initOptions: {
      backend: {
        sdk: createMockSdkLoader(),
      },
    },
  },
});
