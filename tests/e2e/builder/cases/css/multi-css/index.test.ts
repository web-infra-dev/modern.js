import path from 'path';
import { test, expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should emit multiple css files correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: {
      entry1: path.resolve(__dirname, './src/entry1/index.js'),
      entry2: path.resolve(__dirname, './src/entry2/index.js'),
    },
  });

  const files = await builder.unwrapOutputJSON();
  const entry1CSS = Object.keys(files).find(
    file => file.includes('entry1') && file.endsWith('.css'),
  )!;
  const entry2CSS = Object.keys(files).find(
    file => file.includes('entry2') && file.endsWith('.css'),
  )!;

  expect(files[entry1CSS]).toContain('#entry1{color:red}');
  expect(files[entry2CSS]).toContain('#entry2{color:blue}');
});
