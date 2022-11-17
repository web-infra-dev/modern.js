import { defineConfig } from '../../utils';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    format: 'iife',
    outdir: './dist/bundleless',
  } as any,
});
