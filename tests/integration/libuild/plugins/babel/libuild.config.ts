import { defineConfig } from '@/toolkit';
import { babelPlugin } from '@modern-js/libuild-plugin-babel';

export default defineConfig({
  plugins: [
    babelPlugin({
      presets: [['@babel/preset-env']],
    }),
  ],
});
