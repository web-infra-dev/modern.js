import { appTools, defineConfig } from '@modern-js/app-tools';
import { i18nPlugin } from '@modern-js/plugin-i18n';
import { ssgPlugin } from '@modern-js/plugin-ssg';

export default defineConfig({
  server: {
    ssr: process.env.NODE_ENV === 'development',
  },
  output: {
    ssg: {
      routes: ['/zh/about', '/en/about', '/en', '/zh'],
    },
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
    ssgPlugin(),
  ],
});
