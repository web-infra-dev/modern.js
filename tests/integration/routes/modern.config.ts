import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools()],
  runtime: {
    router: true,
    state: false,
  },
  runtimeByEntries: {
    one: {
      router: false,
    },
  },
});
