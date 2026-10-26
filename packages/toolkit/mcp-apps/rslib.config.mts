import { defineConfig } from '@rslib/core';
export default defineConfig({
  lib: [
    ...(['esm', 'cjs'] as const).map(format => ({
      format,
      syntax: 'es2022' as const,
      source: {
        entry: {
          server: './src/server/index.ts',
          manifest: './src/manifest.ts',
        },
      },
      output: {
        target: 'node' as const,
        distPath: { root: format === 'esm' ? 'dist/esm-node' : 'dist/cjs' },
        ...(format === 'cjs' ? { filename: { js: '[name].cjs' } } : {}),
      },
      ...(format === 'esm'
        ? { dts: { distPath: 'dist/types' }, autoExtension: true }
        : {}),
    })),
    {
      format: 'esm',
      syntax: 'es2022',
      source: { entry: { react: './src/ui/react.ts', mf: './src/ui/mf.tsx' } },
      output: { target: 'web', distPath: { root: 'dist/esm' } },
      dts: { distPath: 'dist/types' },
      autoExtension: true,
    },
  ],
});
