import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'umd',
    outdir: './dist/bundleless',
  } as any,
});
