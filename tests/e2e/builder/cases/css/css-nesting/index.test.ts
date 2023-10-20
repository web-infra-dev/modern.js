import path from 'path';
import { expect, test } from '@modern-js/e2e/playwright';
import { build } from '@scripts/shared';

test('should compile CSS nesting correctly', async () => {
  const builder = await build({
    cwd: __dirname,
    entry: { index: path.resolve(__dirname, './src/index.js') },
  });
  const files = await builder.unwrapOutputJSON();

  const content =
    files[Object.keys(files).find(file => file.endsWith('.css'))!];

  expect(content).toEqual(
    '.card h1,.card h2,h3 .card{color:red}.card :is(h1){color:blue}.card .foo{font-size:12px}.card .bar{font-size:14px}.card.baz{font-size:16px}.demo:hover{color:green}.demo :hover{color:cyan}.demo .lg .circle,.demo .lg .triangle{opacity:.25}',
  );
});
