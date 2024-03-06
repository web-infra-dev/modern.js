import { expect, describe, it } from 'vitest';
import { createUniBuilder } from '../src';
import { unwrapConfig } from './helper';

describe('plugin-lazy-compilation', () => {
  it('should allow to use lazy compilation', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        experiments: {
          lazyCompilation: {
            entries: false,
            imports: true,
          },
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.experiments!.lazyCompilation).toEqual({
      entries: false,
      imports: true,
    });
    expect(config.optimization!.splitChunks).toBeFalsy();
  });

  it('should not apply lazy compilation in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        experiments: {
          lazyCompilation: true,
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.experiments?.lazyCompilation).toBeUndefined();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should not apply lazy compilation for node target', async () => {
    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'webpack',
      config: {
        output: {
          targets: ['node'],
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.experiments?.lazyCompilation).toBeUndefined();
  });
});
