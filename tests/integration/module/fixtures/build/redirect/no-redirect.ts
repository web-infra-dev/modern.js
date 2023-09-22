import { defineConfig } from '@modern-js/module-tools/defineConfig';

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
