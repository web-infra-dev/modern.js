import path from 'path';
import { appTools, defineConfig } from '@modern-js/app-tools';

export default defineConfig({
  runtime: {},
  output: {
    disableTsChecker: true,
    tempDir: path.join('node_modules', '.temp-dir'),
  },
  plugins: [appTools({})],
});
