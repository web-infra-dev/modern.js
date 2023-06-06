import { defineConfig } from '@modern-js/builder-cli';

export default defineConfig<'rspack'>({
  output: {
    disableTsChecker: true,
  },
});
