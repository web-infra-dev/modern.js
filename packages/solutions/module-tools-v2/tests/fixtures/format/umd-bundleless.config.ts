import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'umd',
    outdir: './dist/bundleless',
  } as any,
});
