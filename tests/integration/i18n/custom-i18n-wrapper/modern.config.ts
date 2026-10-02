import { appTools, defineConfig } from '@modern-js/app-tools';
import { i18nPlugin } from '@modern-js/plugin-i18n';

export default defineConfig({
  source: {
    disableDefaultEntries: true,
    entries: {
      index: './src/App.tsx',
      csr: './src/csr/App.tsx',
    },
  },
  performance: {
    buildCache: false,
  },
  server: {
    ssr: {
      mode: 'string',
    },
    ssrByEntries: {
      csr: false,
    },
    publicDir: './locales',
  },
  plugins: [
    appTools(),
    i18nPlugin({
      localeDetection: {
        languages: ['en', 'zh-Hant-TW'],
        fallbackLanguage: 'en',
        localePathRedirect: true,
        i18nextDetector: true,
        localeDetectionByEntry: {
          // A locale redirect would select the language from the resulting path
          // and bypass the SSR request detector this regression test exercises.
          index: { localePathRedirect: false },
          csr: {
            languages: ['en', 'zh', 'zh-Hant-TW'],
            // Let the browser detect the language before any locale redirect.
            ignoreRedirectRoutes: ['/detect'],
          },
        },
      },
      backend: {
        enabled: true,
        sdk: true,
      },
    }),
  ],
});
