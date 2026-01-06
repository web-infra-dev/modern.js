import { join } from 'path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { createBuilder } from '../src';

describe('builder rspack', () => {
  afterEach(() => {
    rs.unstubAllEnvs();
  });

  it('should generator rspack config correctly', async () => {
    rs.stubEnv('NODE_ENV', 'development');

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
  });

  it('should generator rspack config correctly when prod', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {},
      cwd: join(__dirname, '..'),
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();
  });

  it('should generator rspack config correctly when node', async () => {
    rs.stubEnv('NODE_ENV', 'production');

    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        environments: {
          server: {
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
  });

  it('should generator rspack config correctly when service-worker', async () => {
    rs.stubEnv('NODE_ENV', 'production');

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
  });
});
