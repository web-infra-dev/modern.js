import fs from 'fs';
import path from 'path';
import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { build } from '@rslib/core';

export const bundleServerPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-bundle-server',

  pre: ['@modern-js/plugin-deploy'],

  setup: api => {
    api.deploy(async () => {
      const { appDirectory } = api.getAppContext();
      const outputDir = path.resolve(appDirectory, '.output');

      await build({
        lib: [
          {
            bundle: true,
            source: {
              alias: {
                '@modern-js/prod-server': require
                  .resolve('@modern-js/prod-server')
                  .replace('cjs', 'esm'),
              },
              entry: {
                index: path.resolve(outputDir, 'index.js'),
              },
            },
            output: {
              distPath: {
                root: outputDir,
              },
              cleanDistPath: false,
              filename: {
                js: 'index.bundle.js',
              },
              minify: true,
            },
            format: 'cjs',
            syntax: ['node 18'],
          },
        ],
      });
    });
  },
});
