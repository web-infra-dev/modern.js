import { join } from 'path';
import { describe, expect, it } from '@rstest/core';
import { createBuilder } from '../src';

describe('builder rspack with cache', () => {
  it('should disable cache by default', async () => {
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {},
      frameworkConfigPath: 'modern.config.ts',
      cwd: join(__dirname, '..'),
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0].cache).toMatchSnapshot();
  });

  it('should generator rspack config correctly with cache', async () => {
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        performance: {
          buildCache: true,
        },
      },
      frameworkConfigPath: 'modern.config.ts',
      cwd: join(__dirname, '..'),
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0].cache).toMatchSnapshot();
  });
});
