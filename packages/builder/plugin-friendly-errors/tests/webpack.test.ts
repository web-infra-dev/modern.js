import os from 'os';
import { describe, expect, test } from 'vitest';
import webpack, { WebpackError } from 'webpack';
import { useFixture, useOutput } from '@modern-js/e2e';
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
          [90mat[39m [90m<ROOT>/tests/webpack.test.ts:<POS>[39m
          [90mat[39m _next32 [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m _next10 [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.eval [as call] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_DELEGATE [as _call] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m Compiler.newCompilation [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m Compiler.compile [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Compiler.readRecords [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m [90m<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m run [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m Compiler.run [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m<ROOT>/tests/webpack.test.ts:<POS>[39m
          [90mat[39m new Promise [90m(<anonymous>)[39m
          [90mat[39m webpackBuild [90m(<ROOT>/tests/webpack.test.ts:<POS>)[39m
          [90mat[39m [90m<ROOT>/tests/webpack.test.ts:<POS>[39m
          [90mat[39m async runTest [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runSuite [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runSuite [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runFiles [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async startTestsNode [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m [90masync <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>[39m
          [90mat[39m async Module.withEnv [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async run [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>)[39m
          [90mat[39m [90masync file:<WORKSPACE>/node_modules/<PNPM_INNER>/tinypool/dist/esm/worker.js:<POS>[39m
      "
    `);
  });

  test('throw new error', async () => {
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
          [90mat[39m [90m<ROOT>/tests/webpack.test.ts:<POS>[39m
          [90mat[39m _next32 [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m _next10 [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.eval [as call] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_DELEGATE [as _call] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m Compiler.newCompilation [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m Compiler.compile [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Compiler.readRecords [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m [90m<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>[39m
          [90mat[39m Hook.eval [as callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m Hook.CALL_ASYNC_DELEGATE [as _callAsync] [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)[39m
          [90mat[39m run [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m Compiler.run [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)[39m
          [90mat[39m [90m<ROOT>/tests/webpack.test.ts:<POS>[39m
          [90mat[39m new Promise [90m(<anonymous>)[39m
          [90mat[39m webpackBuild [90m(<ROOT>/tests/webpack.test.ts:<POS>)[39m
          [90mat[39m [90m<ROOT>/tests/webpack.test.ts:<POS>[39m
          [90mat[39m async runTest [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runSuite [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runSuite [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runFiles [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async startTestsNode [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m [90masync <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>[39m
          [90mat[39m async Module.withEnv [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async run [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>)[39m
          [90mat[39m [90masync file:<WORKSPACE>/node_modules/<PNPM_INNER>/tinypool/dist/esm/worker.js:<POS>[39m
      "
    `);
  });
});
