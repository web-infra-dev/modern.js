import { appTools, defineConfig } from '@modern-js/app-tools';

// WRONG: Next.js-style distDir is not a Modern.js option
export default defineConfig({
  plugins: [appTools()],
  distDir: 'build_output',
});
