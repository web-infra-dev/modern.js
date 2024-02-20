import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    state: true,
  },
  output: {
    disableTsChecker: true,
  },
  plugins: [
    appTools({
      // ts-loader only supports webpack
      bundler: 'webpack',
    }),
  ],
  tools: {
    tsLoader: {},
  },
  experiments: {
    sourceBuild: true,
  },
});
