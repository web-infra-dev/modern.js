import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    router: true,
    state: false,
  },
  runtimeByEntries: {
    one: {
      router: false,
    },
  },
  server: {
    ssr: false,
  },
});
