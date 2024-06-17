import { appTools, defineConfig } from '@modern-js/app-tools';

const bundler = process.env.BUNDLER;

export default defineConfig({
  plugins: [
    appTools({
      bundler: bundler === 'rspack' ? 'experimental-rspack' : 'webpack',
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
