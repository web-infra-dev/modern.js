import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    router: true,
  },
  output: {
    disableTsChecker: true,
    disableSourceMap: true,
    disableFilenameHash: true,
  },
  security: {
    checkSyntax: {
      ecmaVersion: 5,
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
