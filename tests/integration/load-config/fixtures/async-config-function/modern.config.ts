import appTools, { defineConfig } from '@modern-js/app-tools';

export default defineConfig(async () => {
  return {
    output: {
      distPath: {
        root: 'dist/foo',
      },
    },
    plugins: [appTools()],
  };
});
