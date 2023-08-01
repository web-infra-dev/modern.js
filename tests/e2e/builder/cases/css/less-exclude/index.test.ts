import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

webpackOnlyTest('should exclude specified less file', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      tools: {
        less: (opts, { addExcludes }) => {
          addExcludes([/b\.less$/]);
        },
      },
      output: {
        enableAssetFallback: true,
      },
    },
  });

  const files = await builder.unwrapOutputJSON();
  const cssFiles = Object.keys(files).filter(file => file.endsWith('.css'));
  const lessFiles = Object.keys(files).filter(file => file.endsWith('.less'));

  expect(lessFiles.length).toBe(1);
  expect(cssFiles.length).toBe(1);
});
