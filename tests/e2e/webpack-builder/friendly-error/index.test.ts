import path from 'path';
import { expect, test, vi } from 'vitest';
import { createStubBuilder } from '@modern-js/builder-webpack-provider/stub';

test('should save the buildDependencies to cache directory', async () => {
  const mockedError = vi.spyOn(console, 'error');
  const builder = await createStubBuilder({
    webpack: true,
    entry: { index: path.resolve(__dirname, './src/index.js') },
    plugins: 'default',
  });
  builder.removePlugins(['builder-plugin-progress']);
  await expect(builder.unwrapOutputJSON()).rejects.toThrowError();
  expect(mockedError.mock.calls).toMatchInlineSnapshot(`
    [
      [
        "[41m[1m ERROR [22m[49m [31m[1mModuleBuildError[22m[39m[90m:[39m Module build failed (from ../../../../packages/builder/builder-webpack-provider/compiled/babel-loader/index.js):
    SyntaxError: /Users/bytedance/repositories/modern.js/tests/e2e/webpack-builder/friendly-error/src/index.js: Unexpected token, expected \\"{\\" (1:7)

    > 1 | export conts foo = () => {
        |        ^
      2 |   return 'foo';
      3 | }
        [90mat[39m instantiate [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:67:32)[39m
        [90mat[39m constructor [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:364:12)[39m
        [90mat[39m TypeScriptParserMixin.raise [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:3364:19)[39m
        [90mat[39m TypeScriptParserMixin.unexpected [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:3397:16)[39m
        [90mat[39m TypeScriptParserMixin.parseExport [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:14087:16)[39m
        [90mat[39m TypeScriptParserMixin.parseExport [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:9163:20)[39m
        [90mat[39m TypeScriptParserMixin.parseStatementContent [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:13020:27)[39m
        [90mat[39m TypeScriptParserMixin.parseStatementContent [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:9222:18)[39m
        [90mat[39m TypeScriptParserMixin.parseStatement [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:12917:17)[39m
        [90mat[39m TypeScriptParserMixin.parseBlockOrModuleBlockBody [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:13497:25)[39m
        [90mat[39m TypeScriptParserMixin.parseBlockBody [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:13489:10)[39m
        [90mat[39m TypeScriptParserMixin.parseProgram [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:12832:10)[39m
        [90mat[39m TypeScriptParserMixin.parseTopLevel [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:12822:25)[39m
        [90mat[39m TypeScriptParserMixin.parse [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:14674:10)[39m
        [90mat[39m TypeScriptParserMixin.parse [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:9890:18)[39m
        [90mat[39m parse [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.20.3/node_modules/@babel/parser/lib/index.js:14716:38)[39m
        [90mat[39m parser [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+core@7.18.0/node_modules/@babel/core/lib/parser/index.js:52:34)[39m
        [90mat[39m parser.next [90m(<anonymous>)[39m
        [90mat[39m normalizeFile [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+core@7.18.0/node_modules/@babel/core/lib/transformation/normalize-file.js:87:38)[39m
        [90mat[39m normalizeFile.next [90m(<anonymous>)[39m
        [90mat[39m run [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+core@7.18.0/node_modules/@babel/core/lib/transformation/index.js:31:50)[39m
        [90mat[39m run.next [90m(<anonymous>)[39m
        [90mat[39m Function.transform [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+core@7.18.0/node_modules/@babel/core/lib/transform.js:25:41)[39m
        [90mat[39m transform.next [90m(<anonymous>)[39m
        [90mat[39m step [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/gensync@1.0.0-beta.2/node_modules/gensync/index.js:261:32)[39m
        [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/gensync@1.0.0-beta.2/node_modules/gensync/index.js:273:13[39m
        [90mat[39m async.call.result.err.err [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/gensync@1.0.0-beta.2/node_modules/gensync/index.js:223:11)[39m
        [90mat[39m processResult [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.75.0/node_modules/webpack/lib/NormalModule.js:758:19)[39m
        [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.75.0/node_modules/webpack/lib/NormalModule.js:860:5[39m
        [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/loader-runner@4.3.0/node_modules/loader-runner/lib/LoaderRunner.js:400:11[39m
        [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/loader-runner@4.3.0/node_modules/loader-runner/lib/LoaderRunner.js:252:18[39m
        [90mat[39m context.callback [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/loader-runner@4.3.0/node_modules/loader-runner/lib/LoaderRunner.js:124:13)[39m
        [90mat[39m [90m/Users/bytedance/repositories/modern.js/packages/builder/builder-webpack-provider/compiled/babel-loader/index.js:1:130163[39m",
      ],
    ]
  `);
}, 0);
