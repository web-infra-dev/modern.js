import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig<'rspack'>({
  plugins: [
    appTools({
      bundler: 'experiment-rspack',
    }),
  ],
  output: {
    disableSourceMap: false,
  },
});
