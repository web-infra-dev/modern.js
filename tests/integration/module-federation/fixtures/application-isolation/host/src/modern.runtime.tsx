import { defineRuntimeConfig } from '@modern-js/runtime';

export default defineRuntimeConfig({
  i18n: {
    initOptions: {
      resources: {
        zh: { translation: { greeting: '主应用你好' } },
        en: { translation: { greeting: 'Host hello' } },
        fr: { translation: { greeting: 'Hôte bonjour' } },
      },
    },
  },
});
