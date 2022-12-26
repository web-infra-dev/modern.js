import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'umd',
    outDir: './dist/bundleless',
  } as any,
});
