import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'iife',
    outDir: './dist/bundleless',
  } as any,
});
