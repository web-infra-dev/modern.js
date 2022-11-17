import util from 'util';
import { expect, test } from 'vitest';
import { WebpackError } from 'webpack';
import webpack, {
  webpackBuild,
} from '@modern-js/builder-webpack-provider/webpack';
import { useFixture } from '@modern-js/e2e';
import { FriendlyErrorsWebpackPlugin } from '@/plugin';
import { outputPrettyError } from '@/shared/utils';

const useOutput = () => {
  let buf = '';
  const log = (...args: any[]) => {
    buf += util.format(...args);
    buf += '\n';
  };
  const handle = (out: any) => log(out);
  const toString = () => buf;
  return { handle, toString, log };
};

test('fixture', async () => {
  const options = await useFixture('@modern-js/e2e/fixtures/builder/basic', {
    copy: true,
  });
  const output = useOutput();
  const config: webpack.Configuration = {
    context: options.cwd,
    mode: 'production',
    entry: './index.js',
    output: {
      filename: 'main.js',
      path: options.distPath,
    },
    plugins: [new FriendlyErrorsWebpackPlugin({ output: output.handle })],
  };
  const compiler = webpack(config);
  compiler.hooks.compilation.tap('dev', compilation => {
    compilation.errors.push(new WebpackError('foo'));
  });
  await expect(webpackBuild(compiler)).rejects.toThrow();
  expect(output.toString()).toMatchInlineSnapshot(`
    "[41m[1m ERROR [22m[49m [31m[1mError[22m[39m[90m:[39m foo
        [90mat[39m <ROOT>/tests/e2e/webpack.test.ts[90m:42:29[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:19:10[39m
        [90mat[39m <HOME>/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js[90m:19:10[39m
        [90mat[39m <UNKNOWN>/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js[90m:19:10[39m
        [90mat[39m <UNKNOWN>/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js[90m:14:14[39m
        [90mat[39m <UNKNOWN>/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:1122:26[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:1166:29[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js[90m:33:10[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js[90m:18:14[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:1161:28[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:524:12[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:986:5[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:521:11[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js[90m:33:10[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js[90m:18:14[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:518:20[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js[90m:33:10[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js[90m:18:14[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:515:25[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:538:4[39m
        [90mat[39m <ROOT>/builder/builder-webpack-provider/src/core/build.ts[90m:11:14[39m
        [90mat[39m [90m:undefined:undefined[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/packages/builder/builder-webpack-provider/src/core/build.ts[90m:10:10[39m
        [90mat[39m <WORKSPACE>/tests/e2e/webpack.test.ts[90m:44:60[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:488:5[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:576:13[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:620:5[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:638:3[39m
        [90mat[39m async /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/entry.mjs[90m:76:9[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:259:5[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/entry.mjs[90m:71:5[39m
        [90mat[39m async file:/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tinypool@0.2.4/node_modules/tinypool/dist/esm/worker.js[90m:99:20[39m
    "
  `);
  // const result = await webpackBuild(compiler)!;
  // assert(result && 'compilation' in result.stats);
  // const { stats } = result;
  // const errors = stats.compilation.getErrors();
  // console.log('errors: ', errors);
});

test('fixture', async () => {
  const options = await useFixture('@modern-js/e2e/fixtures/builder/basic', {
    copy: true,
  });
  const output = useOutput();
  const config: webpack.Configuration = {
    context: options.cwd,
    mode: 'production',
    entry: './index.js',
    output: {
      filename: 'main.js',
      path: options.distPath,
    },
    plugins: [new FriendlyErrorsWebpackPlugin({ output: output.handle })],
  };
  const compiler = webpack(config);
  compiler.hooks.compilation.tap('dev', () => {
    throw new Error('bar');
  });
  await webpackBuild(compiler).catch(e =>
    outputPrettyError(e, { output: output.handle }),
  );
  expect(output.toString()).toMatchInlineSnapshot(`
    "[41m[1m ERROR [22m[49m [31m[1mError[22m[39m[90m:[39m bar
        [90mat[39m <ROOT>/tests/e2e/webpack.test.ts[90m:99:11[39m
        [90mat[39m <WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js[90m:19:10[39m
        [90mat[39m <HOME>/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js[90m:19:10[39m
        [90mat[39m <UNKNOWN>/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js[90m:19:10[39m
        [90mat[39m <UNKNOWN>/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js[90m:14:14[39m
        [90mat[39m <UNKNOWN>/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:1122:26[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:1166:29[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js[90m:33:10[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js[90m:18:14[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:1161:28[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:524:12[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:986:5[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:521:11[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js[90m:33:10[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js[90m:18:14[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:518:20[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js[90m:33:10[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js[90m:18:14[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:515:25[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js[90m:538:4[39m
        [90mat[39m <ROOT>/builder/builder-webpack-provider/src/core/build.ts[90m:11:14[39m
        [90mat[39m [90m:undefined:undefined[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/packages/builder/builder-webpack-provider/src/core/build.ts[90m:10:10[39m
        [90mat[39m <WORKSPACE>/tests/e2e/webpack.test.ts[90m:101:31[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:488:5[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:576:13[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:620:5[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:638:3[39m
        [90mat[39m async /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/entry.mjs[90m:76:9[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs[90m:259:5[39m
        [90mat[39m /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/entry.mjs[90m:71:5[39m
        [90mat[39m async file:/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tinypool@0.2.4/node_modules/tinypool/dist/esm/worker.js[90m:99:20[39m
    "
  `);
});
