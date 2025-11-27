import { join } from 'path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { describe, expect, it } from '@rstest/core';
import { createBuilder } from '../src';

describe('builder rspack', () => {
  it('should generator rspack config correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        plugins: [
          {
            name: 'user-plugin',
            setup: () => {},
          },
        ],
      },
      cwd: join(__dirname, '..'),
    });

    const {
      origin: { bundlerConfigs, rsbuildConfig },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    expect(
      rsbuildConfig.plugins?.map(p => (p as RsbuildPlugin)?.name),
    ).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should generator rspack config correctly when prod', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {},
      cwd: join(__dirname, '..'),
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

    const rsbuild = await createBuilder({
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
      cwd: join(__dirname, '..'),
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

    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        environments: {
          workerSSR: {
            output: {
              target: 'web-worker',
            },
          },
        },
      },
      cwd: join(__dirname, '..'),
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});
