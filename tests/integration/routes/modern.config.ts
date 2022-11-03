import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    router: true,
    state: true,
  },
  runtimeByEntries: {
    one: {
      router: false,
    },
  },
  // server: {
  //   ssr: {
  //     mode: 'stream',
  //   },
  // },
});
