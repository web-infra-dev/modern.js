import { describe, expect, it } from 'vitest';
import { createUniBuilder } from '../src';
import { matchPlugins, unwrapConfig } from './helper';

describe('output.sourceMap & disableSourceMap', () => {
  it('should use disableSourceMap by default', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {},
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.devtool).toBe('cheap-module-source-map');

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should use disableSourceMap by default in production', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {},
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.devtool).toBe('hidden-source-map');

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should use disableSourceMap when defined', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {
        output: {
          disableSourceMap: {
            js: true,
          },
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.devtool).toBe(false);

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should use sourceMap when defined', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createUniBuilder({
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

  it('should use sourceMap when defined', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createUniBuilder({
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

  it('should use sourceMap when sourceMap and disableSourceMap both defined', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createUniBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {
        output: {
          sourceMap: {
            js: 'cheap-source-map',
          },
          disableSourceMap: {
            js: true,
          },
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.devtool).toBe('cheap-source-map');

    process.env.NODE_ENV = NODE_ENV;
  });
});
