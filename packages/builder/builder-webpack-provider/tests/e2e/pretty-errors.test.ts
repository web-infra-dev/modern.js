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
    const errorMsg = cleanOutput(mockedError);
    expect(errorMsg).toMatch(/ ERROR {2}Error: foo(\n\s+at .+)*/);
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
