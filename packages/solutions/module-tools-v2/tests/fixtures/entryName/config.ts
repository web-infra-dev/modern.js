import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    input: ['./src/index.ts'],
    entryNames: '[name]-[hash]',
    outdir: './dist',
  },
});
