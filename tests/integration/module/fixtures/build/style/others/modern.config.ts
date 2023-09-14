import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      input: ['index.js'],
      style: {
        autoModules: /\.css/,
        modules: {
          localsConvention: 'camelCaseOnly',
        },
        inject: true,
      },
    },
  ],
});
