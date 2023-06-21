import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig<'rspack'>({
  plugins: [appTools({ bundler: 'experimental-rspack' })],
  runtime: {
    router: true,
    state: false,
  },
  runtimeByEntries: {
    one: {
      router: false,
    },
  },
  output: {
    disableTsChecker: true,
  },
});
