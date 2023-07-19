import { defineConfig } from '@modern-js/module-tools/defineConfig';

export default defineConfig({
  buildConfig: [
    {
      input: ['src', '!src/*.spec.ts'],
      outDir: './dist/pattern-1',
      dts: false,
    },
    {
      input: ['src', '!**/*.spec.ts'],
      outDir: './dist/pattern-2',
      dts: false,
    },
  ],
});
