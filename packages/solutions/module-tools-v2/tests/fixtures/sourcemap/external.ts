import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    sourceMap: 'external',
    outdir: './dist/external',
  },
});
