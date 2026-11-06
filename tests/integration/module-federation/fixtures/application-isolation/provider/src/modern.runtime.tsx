import { defineRuntimeConfig } from '@modern-js/runtime';

export default defineRuntimeConfig({
  i18n: {
    initOptions: {
      resources: {
        en: { translation: { greeting: 'Producer hello' } },
        fr: { translation: { greeting: 'Producteur bonjour' } },
        zh: { translation: { greeting: '生产者你好' } },
      },
    },
  },
});
