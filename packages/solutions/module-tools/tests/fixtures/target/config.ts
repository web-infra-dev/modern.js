import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    target: 'es2021',
    buildType: 'bundle',
    outdir: './dist/bundle',
  } as any,
});
