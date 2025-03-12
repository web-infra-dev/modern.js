import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { TsCheckerRspackPlugin } from 'ts-checker-rspack-plugin';

export default defineConfig({
  lib: [
    {
      id: 'runtime',
      source: {
        entry: { index: ['./src/**', '!**/*.stories.*'] },
      },
      output: { target: 'web', distPath: { root: 'dist' } },
      bundle: false,
      dts: false,
      format: 'esm',
      plugins: [pluginReact()],
    },
  ],
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
