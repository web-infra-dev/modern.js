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
        [90mat[39m instantiate [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:72:32)[39m
        [90mat[39m constructor [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:359:12)[39m
        [90mat[39m Object.raise [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:3339:19)[39m
        [90mat[39m Object.unexpected [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:3377:16)[39m
        [90mat[39m Object.parseExport [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:15910:16)[39m
        [90mat[39m Object.parseExport [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:10294:20)[39m
        [90mat[39m Object.parseStatementContent [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:14759:27)[39m
        [90mat[39m Object.parseStatementContent [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:10364:18)[39m
        [90mat[39m Object.parseStatement [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:14643:17)[39m
        [90mat[39m Object.parseBlockOrModuleBlockBody [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:15286:25)[39m
        [90mat[39m Object.parseBlockBody [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:15277:10)[39m
        [90mat[39m Object.parseProgram [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:14561:10)[39m
        [90mat[39m Object.parseTopLevel [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:14548:25)[39m
        [90mat[39m Object.parse [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:16556:10)[39m
        [90mat[39m Object.parse [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:11154:18)[39m
        [90mat[39m parse [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/@babel+parser@7.18.6/node_modules/@babel/parser/lib/index.js:16608:38)[39m
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
        [90mat[39m processResult [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/NormalModule.js:758:19)[39m
        [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/NormalModule.js:860:5[39m
        [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/loader-runner@4.3.0/node_modules/loader-runner/lib/LoaderRunner.js:400:11[39m
        [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/loader-runner@4.3.0/node_modules/loader-runner/lib/LoaderRunner.js:252:18[39m
        [90mat[39m context.callback [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/loader-runner@4.3.0/node_modules/loader-runner/lib/LoaderRunner.js:124:13)[39m
        [90mat[39m [90m/Users/bytedance/repositories/modern.js/packages/builder/builder-webpack-provider/compiled/babel-loader/index.js:1:130163[39m",
      ],
    ]
  `);
}, 0);
