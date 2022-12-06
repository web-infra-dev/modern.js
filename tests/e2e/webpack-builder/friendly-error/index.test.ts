import path from 'path';
import { expect, test, vi } from 'vitest';
import { cleanOutput } from '@modern-js/e2e';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

const pathExpr = /\.{0,2}(\/[a-zA-Z._\-+@0-9]+){3,}/g;
const posExpr = /(?<=<PATH>:)\d+:\d+/g;

test('should save the buildDependencies to cache directory', async () => {
  const mockedError = vi.spyOn(console, 'error');
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    plugins: 'default',
  });
  builder.removePlugins(['builder-plugin-progress']);
  await expect(builder.unwrapOutputJSON()).rejects.toThrowError();
  expect(
    cleanOutput(mockedError)
      .replace(pathExpr, '<PATH>')
      .replace(posExpr, '<POS>')
      .replace(/(?:\s+at .*?(?:<PATH>:<POS>|<anonymous>).*)+/, '<STACK>'),
  ).toMatchInlineSnapshot(`
    " ERROR  ModuleBuildError: Module build failed (from <PATH>):
    SyntaxError: <PATH>: Unexpected token, expected \\"{\\" (1:7)

    > 1 | export conts foo = () => {
        |        ^
      2 |   return 'foo';
      3 | }<STACK>"
  `);
}, 0);
