import { appTools, defineConfig } from '@modern-js/app-tools';
import tailwindcssPlugin from '@modern-js/plugin-tailwindcss';

export default defineConfig({
  dev: { port: 8080 },
  html: { appIcon: './src/assets/icon.png' },
  server: { ssr: { mode: 'string' } },
  plugins: [appTools(), tailwindcssPlugin()],
});
