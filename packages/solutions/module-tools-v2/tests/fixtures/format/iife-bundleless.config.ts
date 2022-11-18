import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'iife',
    outdir: './dist/bundleless',
  } as any,
});
