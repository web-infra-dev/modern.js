import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [AppToolsPlugin()],
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
    ssr: {
      mode: 'stream',
    },
    ssrByEntries: {
      one: false,
      two: false,
      four: false,
    },
  },
});
