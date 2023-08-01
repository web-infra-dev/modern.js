import path from 'path';
import { test, expect } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';
import { fs } from '@modern-js/utils';

test('should compile nested npm import correctly', async () => {
  fs.copySync(
    path.resolve(__dirname, '_node_modules'),
    path.resolve(__dirname, 'node_modules'),
  );

  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  });

  const files = await builder.unwrapOutputJSON();
  const cssFiles = Object.keys(files).find(file => file.endsWith('.css'))!;

  expect(files[cssFiles]).toEqual(
    '#b{color:#ff0}#a{font-size:10px}html{font-size:18px}',
  );
});
