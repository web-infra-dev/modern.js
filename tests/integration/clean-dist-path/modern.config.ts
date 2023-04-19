import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig<'rspack'>({
  output: {
    cleanDistPath: false,
  },
  plugins: [appTools({ bundler: 'experimental-rspack' })],
});
