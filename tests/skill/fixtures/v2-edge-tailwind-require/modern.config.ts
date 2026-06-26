import { appTools, defineConfig } from '@modern-js/app-tools';
const { tailwindcssPlugin } = require('@modern-js/plugin-tailwindcss');

export default defineConfig({
  plugins: [appTools(), tailwindcssPlugin()],
});
