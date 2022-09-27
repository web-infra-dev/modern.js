import { describe, expect, test, vi } from 'vitest';
import { createWatchCompiler } from '../src/core/createCompiler';
import { applyDefaultBuilderOptions } from '../src/shared';
import { createStubBuilder, createStubContext } from '../src/stub';

describe('build hooks', () => {
  test('should call onBeforeBuild hook before build', async () => {
    const fn = vi.fn();
    const builder = await createStubBuilder({
      plugins: [
        {
          name: 'foo',
          setup(api) {
            api.onBeforeBuild(fn);
          },
        },
      ],
    });

    await builder.build();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should call onBeforeBuild hook before build in watch mode', async () => {
    const fn = vi.fn();
    const builder = await createStubBuilder({
      plugins: [
        {
          name: 'foo',
          setup(api) {
            api.onBeforeBuild(fn);
          },
        },
      ],
      buildOptions: {
        watch: true,
      },
    });

    await builder.build();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should return Compiler when passing single webpack config', async () => {
    const context = createStubContext(applyDefaultBuilderOptions({}) as any);
    const compiler = await createWatchCompiler(context, [{}]);
    expect(compiler.constructor.name).toEqual('Compiler');
  });

  test('should return MultiCompiler when passing multiple webpack configs', async () => {
    const context = createStubContext(applyDefaultBuilderOptions({}) as any);
    const compiler = await createWatchCompiler(context, [{}, {}]);
    expect(compiler.constructor.name).toEqual('MultiCompiler');
  });
});
