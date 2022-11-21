import assert from 'assert';
import os from 'os';
import { describe, expect, test, vi } from 'vitest';
import { WebpackError } from 'webpack';
import { useFixture } from '@modern-js/e2e';
import { PluginFriendlyErrors } from '@/plugins/error';
import { createStubBuilder } from '@/stub';

describe('Pretty output errors', () => {
  test.skipIf(os.platform() === 'win32')('compilation.errors', async () => {
    const options = await useFixture('@modern-js/e2e/fixtures/builder/basic', {
      copy: true,
    });
    const builder = await createStubBuilder({
      ...options,
      plugins: {
        builtin: 'minimal',
        additional: [PluginFriendlyErrors()],
      },
    });
    builder.hooks.onAfterCreateCompilerHook.tap(({ compiler }) => {
      assert('compilation' in compiler.hooks);
      compiler.hooks.compilation.tap('test', compilation => {
        compilation.errors.push(new WebpackError('foo'));
      });
    });
    const errorLog = vi.spyOn(console, 'error');
    await expect(builder.build()).rejects.toThrowError();
    expect(errorLog.mock.calls[0][0]).toMatchInlineSnapshot(`
      "[41m[1m ERROR [22m[49m [31m[1mError[22m[39m[90m:[39m foo
          [90mat[39m [90m<ROOT>/tests/e2e/pretty-errors.test.ts:<POS>[39m
          [90mat[39m _next27 [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
          [90mat[39m _next5 [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)[39m
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
          [90mat[39m [90m<ROOT>/src/core/build.ts:<POS>[39m
          [90mat[39m new Promise [90m(<anonymous>)[39m
          [90mat[39m webpackBuild [90m(<ROOT>/src/core/build.ts:<POS>)[39m
          [90mat[39m build [90m(<ROOT>/src/core/build.ts:<POS>)[39m
          [90mat[39m async Object.<anonymous> [90m(<ROOT>/src/stub/builder.ts:<POS>)[39m
          [90mat[39m [90masync <ROOT>/tests/e2e/pretty-errors.test.ts:<POS>[39m
          [90mat[39m async runTest [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runSuite [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runSuite [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async runFiles [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async startTestsNode [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m [90masync <WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>[39m
          [90mat[39m async Module.withEnv [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/chunk-runtime-error.87a2b5a2.mjs:<POS>)[39m
          [90mat[39m async run [90m(<WORKSPACE>/node_modules/<PNPM_INNER>/vitest/dist/entry.mjs:<POS>)[39m
          [90mat[39m [90masync file:<WORKSPACE>/node_modules/<PNPM_INNER>/tinypool/dist/esm/worker.js:<POS>[39m"
    `);
  });
  // Unable to spy on console.error within vitest worker.
  // But it should works fine. You can remove `.skip` to check the output.
  test.skip('compilation.errors', async () => {
    const options = await useFixture('@modern-js/e2e/fixtures/builder/basic', {
      copy: true,
    });
    // const errorLog = vi.spyOn(console, 'error');
    const errorLog = vi.fn();
    console.error = errorLog;
    const builder = await createStubBuilder({
      ...options,
      plugins: {
        builtin: 'minimal',
        additional: [PluginFriendlyErrors()],
      },
    });
    builder.hooks.onAfterCreateCompilerHook.tap(({ compiler }) => {
      assert('compilation' in compiler.hooks);
      compiler.hooks.compilation.tap('test', () => {
        throw new WebpackError('foo');
      });
    });
    const recordStdErr = vi.fn();
    process.on('uncaughtException', recordStdErr);
    process.on('unhandledRejection', recordStdErr);
    await expect(builder.build()).rejects.toThrowErrorMatchingInlineSnapshot(
      '"foo"',
    );
    expect(recordStdErr.mock.calls).toMatchInlineSnapshot('[]');
  });
});
