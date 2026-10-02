import { appTools, defineConfig } from '@modern-js/app-tools';

// https://modernjs.dev/configure/app/usage
export default defineConfig({
  runtime: {
    router: true,
  },
  plugins: [appTools({ bundler: 'rspack' })],
});
