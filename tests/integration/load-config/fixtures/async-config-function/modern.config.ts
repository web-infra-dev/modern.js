import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig(async () => {
  return {
    output: {
      disableTsChecker: true,
      distPath: {
        root: 'dist/foo',
      },
    },
    plugins: [appTools({ bundler: 'experimental-rspack' })],
  };
});
