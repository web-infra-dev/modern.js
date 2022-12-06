import assert from 'assert';
import os from 'os';
import { describe, expect, test, vi } from 'vitest';
import { WebpackError } from 'webpack';
import { cleanOutput, useFixture } from '@modern-js/e2e';
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
    const mockedError = vi.spyOn(console, 'error');
    await expect(builder.build()).rejects.toThrowError();
    expect(cleanOutput(mockedError)).toMatchInlineSnapshot(`
      " ERROR  Error: foo
          at <ROOT>/tests/e2e/pretty-errors.test.ts:<POS>
          at _next27 (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at _next5 (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.eval [as call] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_DELEGATE [as _call] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at Compiler.newCompilation (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Hook.eval [as callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at Compiler.compile (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Compiler.readRecords (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Hook.eval [as callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at <WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>
          at Hook.eval [as callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/HookCodeFactory.js:<POS>)
          at Hook.CALL_ASYNC_DELEGATE [as _callAsync] (<WORKSPACE>/node_modules/<PNPM_INNER>/tapable/lib/Hook.js:<POS>)
          at run (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at Compiler.run (<WORKSPACE>/node_modules/<PNPM_INNER>/webpack/lib/Compiler.js:<POS>)
          at <ROOT>/src/core/build.ts:<POS>
          at new Promise (<anonymous>)
          at webpackBuild (<ROOT>/src/core/build.ts:<POS>)
          at build (<ROOT>/src/core/build.ts:<POS>)
          at async Object.<anonymous> (<ROOT>/src/stub/builder.ts:<POS>)"
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
    expect(cleanOutput(recordStdErr)).toMatchInlineSnapshot('[]');
  });
});
