import { describe, expect, it } from '@rstest/core';
import { createBuilder } from '../src';
import { unwrapConfig } from './helper';

describe('experiments.nativeWatcher', () => {
  it('should be enabled by default', async () => {
    const rsbuild = await createBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {},
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.experiments?.nativeWatcher).toBe(true);
  });

  it('should be overridable by tools.rspack', async () => {
    const rsbuild = await createBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {
        tools: {
          rspack: {
            experiments: {
              nativeWatcher: false,
            },
          },
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.experiments?.nativeWatcher).toBe(false);
  });

  it('should be overridable by tools.bundlerChain', async () => {
    const rsbuild = await createBuilder({
      cwd: '',
      bundlerType: 'rspack',
      config: {
        tools: {
          bundlerChain: chain => {
            chain.experiments({
              ...chain.get('experiments'),
              nativeWatcher: false,
            });
          },
        },
      },
    });

    const config = await unwrapConfig(rsbuild);

    expect(config.experiments?.nativeWatcher).toBe(false);
  });
});
