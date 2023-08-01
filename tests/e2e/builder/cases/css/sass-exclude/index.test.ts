import path from 'path';
import { expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import { webpackOnlyTest } from '@scripts/helper';

webpackOnlyTest('should exclude specified scss file', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    builderConfig: {
      tools: {
        sass: (opts, { addExcludes }) => {
          addExcludes([/b\.scss$/]);
        },
      },
      output: {
        enableAssetFallback: true,
      },
    },
  });

  const files = await builder.unwrapOutputJSON();
  const cssFiles = Object.keys(files).filter(file => file.endsWith('.css'));
  const scssFiles = Object.keys(files).filter(file => file.endsWith('.scss'));

  expect(scssFiles.length).toBe(1);
  expect(cssFiles.length).toBe(1);
});
