import { appTools, defineConfig } from '@modern-js/app-tools';
import { i18nPlugin } from '@modern-js/plugin-i18n';
import { moduleFederationPlugin } from '@module-federation/modern-js';

export default defineConfig({
  server: {
    // ssr: {
    //   mode: 'stream',
    // },
    port: 3005,
  },
  performance: {
    buildCache: false,
  },
  plugins: [
    appTools(),
    i18nPlugin({
      localeDetection: {
        localePathRedirect: true,
        languages: ['zh', 'en'],
        fallbackLanguage: 'en',
        ignoreRedirectRoutes: ['/about', '/'],
      },
    }),
    moduleFederationPlugin(),
  ],
});
