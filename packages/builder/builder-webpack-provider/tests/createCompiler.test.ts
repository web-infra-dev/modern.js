import { describe, expect, test, vi } from 'vitest';
import { applyDefaultBuilderOptions } from '@modern-js/builder-shared';
import { createStubBuilder, createStubContext } from '@/stub';
import { createCompiler } from '@/core/createCompiler';
import { StubBuilderOptions } from '@/stub/builder';

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

  const createDefaultContext = () =>
    createStubContext(
      applyDefaultBuilderOptions({}) as Required<StubBuilderOptions>,
    );

  test('should return Compiler when passing single webpack config', async () => {
    const compiler = await createCompiler({
      context: createDefaultContext(),
      webpackConfigs: [{}],
    });
    expect(compiler.constructor.name).toEqual('Compiler');
  });

  test('should return MultiCompiler when passing multiple webpack configs', async () => {
    const compiler = await createCompiler({
      context: createDefaultContext(),
      webpackConfigs: [{}, {}],
    });
    expect(compiler.constructor.name).toEqual('MultiCompiler');
  });
});
