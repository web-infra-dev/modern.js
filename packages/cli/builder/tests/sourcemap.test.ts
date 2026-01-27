import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { createBuilder } from '../src';
import { unwrapConfig } from './helper';

describe('output.sourceMap', () => {
  afterEach(() => {
    rs.unstubAllEnvs();
  });
  it('should use default value in development', async () => {
    rs.stubEnv('NODE_ENV', 'development');

    const rsbuild = await createBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {},
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.devtool).toBe('cheap-module-source-map');
  });

  it('should use default value in production', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {},
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.devtool).toBe('hidden-source-map');
  });

  it('should use sourceMap when defined', async () => {
    rs.stubEnv('NODE_ENV', 'production');

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
  });

  it('should use sourceMap false', async () => {
    rs.stubEnv('NODE_ENV', 'production');

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
  });
});
