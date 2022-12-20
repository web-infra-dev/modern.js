import { defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {
    state: true,
  },
  output: {
    disableTsChecker: true,
  },
});
