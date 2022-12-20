import { defineConfig } from '@modern-js/app-tools';
import TestingPlugin from '@modern-js/plugin-testing';

export default defineConfig({
  runtime: {
    state: true,
  },
  plugins: [TestingPlugin()],
});
