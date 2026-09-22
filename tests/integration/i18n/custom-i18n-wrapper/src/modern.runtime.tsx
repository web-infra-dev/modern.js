import { defineRuntimeConfig } from '@modern-js/runtime';
import I18n from './i18n';
import { createMockSdkLoader } from './mock-sdk';

export default defineRuntimeConfig({
  i18n: {
    i18nInstance: I18n,
    initOptions: {
      backend: {
        sdk: createMockSdkLoader(),
      },
    },
  },
});
