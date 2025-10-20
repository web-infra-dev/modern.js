import { appTools, defineConfig } from '@modern-js/app-tools';
import { i18nPlugin } from '@modern-js/plugin-i18n';

export default defineConfig({
  server: {
    ssr: true,
  },
  plugins: [
    appTools(),
    i18nPlugin({
      localeDetection: {
        enable: true,
        languages: ['zh', 'en'],
        fallbackLanguage: 'en',
      },
    }),
  ],
});
