import { defineConfig } from '@modern-js/app-tools';
import testingPlugin from '@modern-js/plugin-testing';

export default defineConfig({
  runtime: {
    state: true,
  },
  plugins: [testingPlugin()],
});
