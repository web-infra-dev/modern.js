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
      .replace(posExpr, '<POS>'),
  ).toMatchInlineSnapshot(`
    " ERROR  ModuleBuildError: Module build failed (from <PATH>):
    SyntaxError: <PATH>: Unexpected token, expected \\"{\\" (1:7)

    > 1 | export conts foo = () => {
        |        ^
      2 |   return 'foo';
      3 | }
        at instantiate (<PATH>:<POS>)
        at constructor (<PATH>:<POS>)
        at TypeScriptParserMixin.raise (<PATH>:<POS>)
        at TypeScriptParserMixin.unexpected (<PATH>:<POS>)
        at TypeScriptParserMixin.parseExport (<PATH>:<POS>)
        at TypeScriptParserMixin.parseExport (<PATH>:<POS>)
        at TypeScriptParserMixin.parseStatementContent (<PATH>:<POS>)
        at TypeScriptParserMixin.parseStatementContent (<PATH>:<POS>)
        at TypeScriptParserMixin.parseStatement (<PATH>:<POS>)
        at TypeScriptParserMixin.parseBlockOrModuleBlockBody (<PATH>:<POS>)
        at TypeScriptParserMixin.parseBlockBody (<PATH>:<POS>)
        at TypeScriptParserMixin.parseProgram (<PATH>:<POS>)
        at TypeScriptParserMixin.parseTopLevel (<PATH>:<POS>)
        at TypeScriptParserMixin.parse (<PATH>:<POS>)
        at TypeScriptParserMixin.parse (<PATH>:<POS>)
        at parse (<PATH>:<POS>)
        at parser (<PATH>:<POS>)
        at parser.next (<anonymous>)
        at normalizeFile (<PATH>:<POS>)
        at normalizeFile.next (<anonymous>)
        at run (<PATH>:<POS>)
        at run.next (<anonymous>)
        at Function.transform (<PATH>:<POS>)
        at transform.next (<anonymous>)
        at step (<PATH>:<POS>)
        at <PATH>:<POS>
        at async.call.result.err.err (<PATH>:<POS>)
        at processResult (<PATH>:<POS>)
        at <PATH>:<POS>
        at <PATH>:<POS>
        at <PATH>:<POS>
        at context.callback (<PATH>:<POS>)
        at <PATH>:<POS>"
  `);
}, 0);
