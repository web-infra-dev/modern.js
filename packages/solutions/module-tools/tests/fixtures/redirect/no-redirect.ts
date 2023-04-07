import { defineConfig } from '@modern-js/self/defineConfig';

export default defineConfig({
  buildConfig: {
    buildType: 'bundleless',
    redirect: {
      style: false,
    },
    format: 'esm',
    target: 'esnext',
    outDir: './dist/no-redirect',
  },
});
