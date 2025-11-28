import { appTools, defineConfig } from '@modern-js/app-tools';
import { i18nPlugin } from '@modern-js/plugin-i18n';

export default defineConfig({
  performance: {
    buildCache: false,
  },
  server: {
    publicDir: './locales',
  },
  plugins: [
    appTools(),
    i18nPlugin({
      localeDetection: {
        localePathRedirect: true,
        languages: ['zh', 'en'],
        fallbackLanguage: 'en',
      },
      backend: {
        enabled: true,
        sdk: true,
      },
    }),
  ],
});
