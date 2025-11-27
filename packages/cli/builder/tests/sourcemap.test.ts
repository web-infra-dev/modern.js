import { describe, expect, it } from '@rstest/core';
import { createBuilder } from '../src';
import { unwrapConfig } from './helper';

describe('output.sourceMap', () => {
  it('should use default value', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {},
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.devtool).toBe('cheap-module-source-map');

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should use default value in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {},
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.devtool).toBe('hidden-source-map');

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should use sourceMap when defined', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {
        output: {
          sourceMap: true,
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.devtool).toBe('source-map');

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should use sourceMap false', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {
        output: {
          sourceMap: false,
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.devtool).toBe(false);

    process.env.NODE_ENV = NODE_ENV;
  });
});
