import os from 'os';
import { describe, expect, test, vi } from 'vitest';
import webpack, { WebpackError } from 'webpack';
import _ from '@modern-js/utils/lodash';
import { useFixture } from '@modern-js/e2e';
import { FriendlyErrorsWebpackPlugin } from '@/plugin';
import { outputPrettyError } from '@/shared/utils';

export const webpackBuild = async (compiler: webpack.Compiler) => {
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      // When using run or watch, call close and wait for it to finish before calling run or watch again.
      // Concurrent compilations will corrupt the output files.
      compiler.close(closeErr => {
        console.error(closeErr);
        if (err || !stats || stats.hasErrors()) {
          const buildError: Error & { stats?: webpack.Stats } =
            err || new Error('Webpack build failed!');
          buildError.stats = stats;
          reject(buildError);
        } else {
          resolve({ stats });
        }
      });
    });
  });
};

describe.skipIf(os.platform() === 'win32')('webpack', () => {
  test('compilation.errors', async () => {
    const mockedError = vi.spyOn(console, 'error').mockImplementation(_.noop);
    const options = await useFixture('@modern-js/e2e/fixtures/builder/basic', {
      copy: true,
    });
    const config: webpack.Configuration = {
      context: options.cwd,
      mode: 'production',
      entry: './index.js',
      output: {
        filename: 'main.js',
        path: options.distPath,
      },
      plugins: [new FriendlyErrorsWebpackPlugin()],
    };
    const compiler = webpack(config);
    compiler.hooks.compilation.tap('dev', compilation => {
      compilation.errors.push(new WebpackError('foo'));
    });
    await expect(webpackBuild(compiler)).rejects.toThrow();
    expect(mockedError.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "[41m[1m ERROR [22m[49m [31m[1mError[22m[39m[90m:[39m foo
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/packages/builder/friendly-errors-webpack-plugin/tests/webpack.test.ts:<POS>[39m
          [90mat[39m _next32 [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m _next10 [90m(<HOME>/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.eval [as call] [90m(<UNKNOWN>/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_DELEGATE [as _call] [90m(<UNKNOWN>/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m Compiler.newCompilation [90m(<UNKNOWN>/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m Compiler.compile [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Compiler.readRecords [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m run [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m Compiler.run [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/packages/builder/friendly-errors-webpack-plugin/tests/webpack.test.ts:<POS>[39m
          [90mat[39m new Promise [90m(<anonymous>)[39m
          [90mat[39m webpackBuild [90m(<ROOT>/tests/webpack.test.ts:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/packages/builder/friendly-errors-webpack-plugin/tests/webpack.test.ts:<POS>[39m
          [90mat[39m async runTest [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runSuite [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runSuite [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runFiles [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async startTestsNode [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m [90masync /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/entry.mjs:<POS>[39m
          [90mat[39m async Module.withEnv [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async run [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/entry.mjs:<POS>)[39m
          [90mat[39m [90masync file:/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tinypool@0.2.4/node_modules/tinypool/dist/esm/worker.js:<POS>[39m",
        ],
        [
          null,
        ],
      ]
    `);
  });

  test('throw new error', async () => {
    const mockedError = vi.spyOn(console, 'error').mockImplementation(_.noop);
    const options = await useFixture('@modern-js/e2e/fixtures/builder/basic', {
      copy: true,
    });
    const config: webpack.Configuration = {
      context: options.cwd,
      mode: 'production',
      entry: './index.js',
      output: {
        filename: 'main.js',
        path: options.distPath,
      },
      plugins: [new FriendlyErrorsWebpackPlugin()],
    };
    const compiler = webpack(config);
    compiler.hooks.compilation.tap('dev', () => {
      throw new Error('bar');
    });
    await webpackBuild(compiler).catch(e => outputPrettyError(e));
    expect(mockedError.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "[41m[1m ERROR [22m[49m [31m[1mError[22m[39m[90m:[39m bar
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/packages/builder/friendly-errors-webpack-plugin/tests/webpack.test.ts:<POS>[39m
          [90mat[39m _next32 [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m _next10 [90m(<HOME>/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.eval [as call] [90m(<UNKNOWN>/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_DELEGATE [as _call] [90m(<UNKNOWN>/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m Compiler.newCompilation [90m(<UNKNOWN>/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m Compiler.compile [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Compiler.readRecords [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tapable@2.2.1/node_modules/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m run [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m Compiler.run [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/webpack@5.74.0/node_modules/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/packages/builder/friendly-errors-webpack-plugin/tests/webpack.test.ts:<POS>[39m
          [90mat[39m new Promise [90m(<anonymous>)[39m
          [90mat[39m webpackBuild [90m(<ROOT>/tests/webpack.test.ts:<POS>)[39m
          [90mat[39m [90m/Users/bytedance/repositories/modern.js/packages/builder/friendly-errors-webpack-plugin/tests/webpack.test.ts:<POS>[39m
          [90mat[39m async runTest [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runSuite [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runSuite [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runFiles [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async startTestsNode [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m [90masync /Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/entry.mjs:<POS>[39m
          [90mat[39m async Module.withEnv [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async run [90m(/Users/bytedance/repositories/modern.js/node_modules/.pnpm/vitest@0.21.1_@vitest+ui@0.21.1/node_modules/vitest/dist/entry.mjs:<POS>)[39m
          [90mat[39m [90masync file:/Users/bytedance/repositories/modern.js/node_modules/.pnpm/tinypool@0.2.4/node_modules/tinypool/dist/esm/worker.js:<POS>[39m",
        ],
      ]
    `);
  });
});
