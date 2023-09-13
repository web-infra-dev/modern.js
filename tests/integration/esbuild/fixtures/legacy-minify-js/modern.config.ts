import { appTools, defineLegacyConfig } from '@modern-js/app-tools';

export default defineLegacyConfig({
  tools: {
    esbuild: {},
  },
  output: {
    disableTsChecker: true,
  },
  plugins: [appTools()],
});
