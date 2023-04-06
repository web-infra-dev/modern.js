import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  plugins: [appTools({ bundler: 'experimental-rspack' })],
  server: {
    ssr: true,
  },
});
