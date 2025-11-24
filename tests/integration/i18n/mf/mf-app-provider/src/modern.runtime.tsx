import { defineRuntimeConfig } from '@modern-js/runtime';
import i18nextCustom from './custom/i18n';
import i18nextMfAppProvider from './i18n-mf-app-provider/i18n';

export default defineRuntimeConfig((entryName: string) => {
  return {
    i18n: {
      i18nInstance:
        entryName === 'custom' ? i18nextCustom : i18nextMfAppProvider,
    },
  };
});
