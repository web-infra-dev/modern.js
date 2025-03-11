import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      id: 'runtime',
      source: {
        entry: { index: ['./src/**', '!**/*.stories.*'] },
        tsconfigPath: './tsconfig.runtime.json',
      },
      output: { target: 'web', distPath: { root: 'dist/runtime' } },
      bundle: false,
      dts: true,
      format: 'esm',
      plugins: [pluginReact()],
    },
    {
      id: 'plugin',
      source: {
        entry: { index: ['./lib/**'] },
        tsconfigPath: './tsconfig.plugin.json',
      },
      output: { target: 'node', distPath: { root: 'dist/plugin' } },
      bundle: false,
      dts: true,
      format: 'cjs',
    },
  ],
});
