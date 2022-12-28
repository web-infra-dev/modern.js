import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import TailWindCssPlugin from '@modern-js/plugin-tailwindcss';

export default defineConfig({
  plugins: [AppToolsPlugin(), TailWindCssPlugin()],
});
