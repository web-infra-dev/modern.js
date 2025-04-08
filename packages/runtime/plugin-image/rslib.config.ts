import { URLSearchParams } from 'url';
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
    rspack(config, { appendPlugins }) {
      appendPlugins(
        new TsCheckerRspackPlugin({
          typescript: {
            build: true,
            mode: 'write-dts',
          },
        }),
      );

      config.module ||= {};
      config.module.rules ||= [];
      config.module.rules.push({
        resourceQuery: /\?image$/,
        use: [{ loader: require.resolve('./tests/fixtures/loader.cjs') }],
        type: 'javascript/auto',
      });
    },
  },
});
