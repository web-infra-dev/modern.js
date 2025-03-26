import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin';
import { createDefines } from './define.config';

export default defineConfig({
  source: {
    entry: { index: ['./src/**', '!**/*.stories.*', '!**/*.test.*'] },
    define: {
      ...createDefines(),
    },
  },
  output: {
    target: 'web',
    distPath: { root: 'dist' },
  },
  lib: [
    { format: 'esm', bundle: false },
    { format: 'cjs', bundle: false },
  ],
  plugins: [pluginReact()],
  tools: {
    rspack(config) {
      config.plugins ||= [];
      config.plugins.push(
        new TsCheckerRspackPlugin({
          typescript: {
            build: true,
            mode: 'write-dts',
          },
        }),
      );
    },
  },
});
