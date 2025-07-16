import { appTools, defineConfig } from '@modern-js/app-tools';
import { imagePlugin } from '@modern-js/image';

export default defineConfig({
  runtime: {
    router: true,
  },
  source: {
    mainEntryName: 'main',
  },
  output: {
    // disable polyfill and ts checker to make test faster
    polyfill: 'off',
    disableTsChecker: true,
    filenameHash: false,
    minify: false,
  },
  performance: {
    buildCache: false,
  },
  tools: {
    devServer: {},
  },
  plugins: [appTools(), imagePlugin({ loader: './src/image-loader' })],
});
