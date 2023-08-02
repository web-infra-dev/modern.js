import path from 'path';
import { test, expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should compile less inline js correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  });

  const files = await builder.unwrapOutputJSON();
  const cssFiles = Object.keys(files).find(file => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual('body{width:200}');
});
