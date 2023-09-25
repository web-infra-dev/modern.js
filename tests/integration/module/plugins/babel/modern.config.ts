import { defineConfig } from '@modern-js/module-tools/defineConfig';
import { modulePluginBabel } from '@modern-js/plugin-module-babel';

export default defineConfig({
  buildConfig: {
    input: ['./src/index.js'],
  },

  plugins: [
    modulePluginBabel({
      presets: [[require('@babel/preset-env')]],
    }),
  ],
});
