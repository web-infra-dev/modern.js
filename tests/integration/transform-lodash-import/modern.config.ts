import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  source: {
    transformImport: [
      {
        libraryName: 'lodash',
        customName: name => {
          return `lodash/${name}`;
        },
      },
    ],
  },
  plugins: [
    appTools({
      bundler: 'webpack',
    }),
  ],
});
