import { defineConfig } from '@modern-js/self';

export default defineConfig({
  buildConfig: {
    target: 'es2021',
    buildType: 'bundle',
    outdir: './dist/bundle',
  } as any,
});
