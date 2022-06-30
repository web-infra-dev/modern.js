import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          sourceDir: './static',
          static: {
            path: './static0',
          },
        },
      },
    ],
  },
});
