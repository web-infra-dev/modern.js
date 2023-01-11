import appTools, { defineConfig } from '@modern-js/app-tools';
import tailwindcssPlugin from '@modern-js/plugin-tailwindcss';

export default defineConfig({
  plugins: [appTools(), tailwindcssPlugin()],
});
