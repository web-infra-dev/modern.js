import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'cjs',
    outdir: './dist/bundle',
  },
});
