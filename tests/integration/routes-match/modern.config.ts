import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [
    appTools({
      bundler: 'rspack',
    }),
  ],
  runtime: {
    router: false,
    state: false,
  },
  server: {
    ssr: true,
    routes: {
      a: '/detail/:id',
      b: '/detail/1',
      c: '/detail/12',
    },
  },
});
