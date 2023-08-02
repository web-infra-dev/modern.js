import { appTools, defineConfig } from '@modern-js/app-tools';

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
  tools: {
    webpackChain(chain) {
      chain.optimization.runtimeChunk(false);
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
