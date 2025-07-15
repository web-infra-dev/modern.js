import type { RsbuildPlugin } from '@rsbuild/core';
import { describe, expect, it } from 'vitest';
import { createUniBuilder } from '../src';

describe('uni-builder rspack with cache', () => {
  it('should disable cache by default', async () => {
    const rsbuild = await createUniBuilder({
      bundlerType: 'rspack',
      config: {},
      frameworkConfigPath: 'modern.config.ts',
      cwd: '',
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0].cache).toBeUndefined();
    expect(bundlerConfigs[0].experiments?.cache).toBeUndefined();
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
