import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    state: true,
  },
  plugins: [
    appTools({
      bundler:
        process.env.PROVIDE_TYPE === 'rspack'
          ? 'experimental-rspack'
          : 'webpack',
    }),
  ],
  experiments: {
    sourceBuild: true,
  },
});
