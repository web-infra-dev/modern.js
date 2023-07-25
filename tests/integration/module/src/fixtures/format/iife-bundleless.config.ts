import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'iife',
    outDir: './dist/bundleless',
  } as any,
});
