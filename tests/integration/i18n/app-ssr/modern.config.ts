import { appTools, defineConfig } from '@modern-js/app-tools';
import { i18nPlugin } from '@modern-js/plugin-i18n';

// Exercise request detection without a locale redirect selecting the language first.
const requestDetection = process.env.I18N_REQUEST_DETECTION === 'true';

export default defineConfig({
  source: {
    globalVars: {
      'process.env.I18N_REQUEST_DETECTION': String(requestDetection),
    },
  },
  server: {
    ssr: {
      mode: 'string',
    },
    publicDir: './locales',
  },
  plugins: [
    appTools(),
    i18nPlugin({
      localeDetection: {
        localePathRedirect: !requestDetection,
        i18nextDetector: requestDetection,
        languages: ['zh', 'en'],
        fallbackLanguage: 'en',
      },
      backend: {
        enabled: true,
      },
    }),
  ],
  performance: {
    buildCache: false,
  },
});
