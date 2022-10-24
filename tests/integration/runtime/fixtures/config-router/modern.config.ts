import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    router: {
      loading: '@/Loading',
    },
    state: true,
  },
  server: {
    ssr: true,
  },
});
