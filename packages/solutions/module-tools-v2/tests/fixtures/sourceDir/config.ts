import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    bundlelessOptions: {
      sourceDir: './lib',
    },
  },
});
