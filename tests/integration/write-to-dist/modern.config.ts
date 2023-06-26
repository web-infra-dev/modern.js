import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    router: true,
  },
  server: {
    // ssr: true,
  },
  tools: {
    devServer: {
      devMiddleware: {
        writeToDisk: false,
      },
    },
  },
  plugins: [
    appTools({
      bundler:
        process.env.PROVIDE_TYPE === 'rspack'
          ? 'experimental-rspack'
          : 'webpack',
    }),
  ],
});
