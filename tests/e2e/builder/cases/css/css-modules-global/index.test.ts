import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should compile CSS modules with :global() correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  expect(content).toMatch(
    /.*\{position:relative\}.* \.bar,.* \.baz\{height:100%;overflow:hidden\}.* \.lol{width:80%}/,
  );
});
