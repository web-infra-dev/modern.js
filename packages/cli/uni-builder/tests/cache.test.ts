import type { RsbuildPlugin } from '@rsbuild/core';
import { describe, expect, it } from 'vitest';
import { createUniBuilder } from '../src';

describe('uni-builder rspack with cache', () => {
  it('should enable cache by default', async () => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {},
      frameworkConfigPath: 'modern.config.ts',
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0].cache).toBeTruthy();
    expect(bundlerConfigs[0].experiments?.cache).toMatchSnapshot();
  });

  it('should generator rspack config correctly with cache', async () => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {
        performance: {
          buildCache: true,
        },
      },
      frameworkConfigPath: 'modern.config.ts',
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0].cache).toBeTruthy();
    expect(bundlerConfigs[0].experiments?.cache).toMatchSnapshot();
  });
});

describe('uni-builder webpack with cache', () => {
  it('should generator webpack config correctly with cache (default)', async () => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      config: {},
      frameworkConfigPath: 'modern.config.ts',
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0].cache).toMatchSnapshot();
  });

  it('should disable cache correctly', async () => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'webpack',
      config: {
        performance: {
          buildCache: false,
        },
      },
      frameworkConfigPath: 'modern.config.ts',
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0].cache).toBeUndefined();
  });
});
