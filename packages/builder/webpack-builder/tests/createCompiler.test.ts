import { describe, expect, test, vi } from 'vitest';
import { createCompiler } from '../src/core/createCompiler';
import { createPrimaryContext } from '../src/core/createContext';
import { createStubBuilder } from '../src/stub';
import { createDefaultStubBuilderOptions } from '../src/stub/builder';

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
    createPrimaryContext(createDefaultStubBuilderOptions());

  test('should return Compiler when passing single webpack config', async () => {
    const compiler = await createCompiler({
      context: await createDefaultContext(),
      webpackConfigs: [{}],
    });
    expect(compiler.constructor.name).toEqual('Compiler');
  });

  test('should return MultiCompiler when passing multiple webpack configs', async () => {
    const compiler = await createCompiler({
      context: await createDefaultContext(),
      webpackConfigs: [{}, {}],
    });
    expect(compiler.constructor.name).toEqual('MultiCompiler');
  });
});
