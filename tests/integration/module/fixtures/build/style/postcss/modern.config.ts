import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      input: ['style.css'],
      style: {
        postcss(_, { addPlugins }) {
          addPlugins([require('postcss-alias')]);
        },
      },
      outDir: 'dist/function',
    },
    {
      input: ['style.css'],
      style: {
        postcss: {
          plugins: [require('postcss-alias')],
        },
      },
      outDir: 'dist/object',
    },
  ],
});
