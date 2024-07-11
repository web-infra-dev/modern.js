import { describe, it, expect } from 'vitest';
import { createUniBuilder } from '../src';

describe('uni-builder rspack', () => {
  it('should generator rspack config correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {},
      cwd: '',
    });

    const {
      origin: { bundlerConfigs, rsbuildConfig },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    expect(rsbuildConfig.pluginNames).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should generator rspack config correctly when prod', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {},
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should generator rspack config correctly when node', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {
        environments: {
          node: {
            output: {
              target: 'node',
            },
          },
        },
      },
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should generator rspack config correctly when service-worker', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {
        environments: {
          serviceWorker: {
            output: {
              target: 'web-worker',
            },
          },
        },
      },
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});

describe('uni-builder webpack', () => {
  it('should generator webpack config correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      config: {},
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should generator webpack config correctly when prod', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      config: {},
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});
