import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      input: ['style.css'],
      outDir: 'dist/object',
      style: {
        tailwindcss: {
          theme: {
            extend: {
              black: 'white',
            },
          },
        },
      },
    },
    {
      input: ['style.css'],
      outDir: 'dist/function',
      style: {
        tailwindcss: options => {
          options.theme = {
            extend: {
              black: 'white',
            },
          };
        },
      },
    },
  ],
});
