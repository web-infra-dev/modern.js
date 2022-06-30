import { defineConfig } from '@modern-js/module-tools';

export default defineConfig({
  output: {
    buildConfig: [
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          sourceDir: './style',
          style: {
            path: './style0',
          },
        },
      },
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          sourceDir: './style1',
          style: {
            compileMode: 'all',
            path: './style1',
          },
        },
      },
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          sourceDir: './style2',
          style: {
            compileMode: 'only-compiled-code',
            path: './style2',
          },
        },
      },
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          sourceDir: './style3',
          style: {
            compileMode: 'only-source-code',
            path: './style3',
          },
        },
      },
      {
        buildType: 'bundleless',
        bundlelessOptions: {
          sourceDir: './style4',
          style: {
            compileMode: false,
            path: './style4',
          },
        },
      },
    ],
  },
});
