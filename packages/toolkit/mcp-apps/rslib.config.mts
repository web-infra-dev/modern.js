import { defineConfig } from '@rslib/core';
export default defineConfig({
  lib: [
    ...(['esm', 'cjs'] as const).map(format => ({
      format,
      syntax: 'es2022' as const,
      source: {
        entry: {
          cli: './src/cli/index.ts',
          'server-plugin': './src/cli/server-plugin.ts',
          server: './src/server/index.ts',
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
      source: {
        entry: {
          react: './src/ui/react.ts',
          'mf-entry': './src/ui/mf-entry.ts',
        },
      },
      output: { target: 'web', distPath: { root: 'dist/esm' } },
      dts: { distPath: 'dist/types' },
      autoExtension: true,
    },
  ],
});
