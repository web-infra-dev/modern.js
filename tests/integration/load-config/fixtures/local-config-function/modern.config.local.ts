import { defineConfig } from '@modern-js/app-tools';

export default defineConfig(function () {
  return {
    output: {
      distPath: {
        root: 'dist/bar',
      },
    },
  };
});
