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
        languages: ['en', 'zh'],
        fallbackLanguage: 'en',
        localePathRedirect: true,
        i18nextDetector: true,
      },
      backend: {
        enabled: true,
        sdk: true,
      },
    }),
  ],
});
