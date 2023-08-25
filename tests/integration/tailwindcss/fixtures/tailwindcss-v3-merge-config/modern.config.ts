import { appTools, defineConfig } from '@modern-js/app-tools';
import { tailwindcssPlugin } from '@modern-js/plugin-tailwindcss';

export default defineConfig({
  plugins: [
    appTools({
      bundler:
        process.env.PROVIDE_TYPE === 'rspack'
          ? 'experimental-rspack'
          : 'webpack',
    }),
    tailwindcssPlugin(),
  ],
  tools: {
    tailwindcss: {
      theme: {
        colors: {
          'red-500': 'green',
        },
      },
    },
  },
});
