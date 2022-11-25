import { expect, describe, it } from 'vitest';
import { PluginTsChecker } from '@/plugins/tsChecker';
import { createStubBuilder } from '@/stub';
import type { Context } from '@/types';

describe('plugins/tsChecker', () => {
  const context = {
    tsconfigPath: '/path/tsconfig.json',
  } as Context;

  it('should disable ts-checker when output.disableTsChecker is true', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginTsChecker()],
      context,
      builderConfig: {
        output: {
          disableTsChecker: true,
        },
      },
    });

    expect(
      await builder.matchWebpackPlugin('ForkTsCheckerWebpackPlugin'),
    ).toBeFalsy();
  });

  it('should enable tsChecker plugin by default', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginTsChecker()],
      context,
      builderConfig: {
        tools: {},
      },
    });

    expect(
      await builder.matchWebpackPlugin('ForkTsCheckerWebpackPlugin'),
    ).toBeTruthy();
  });

  it('should enable tsChecker plugin when tools.tsChecker is empty object', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginTsChecker()],
      context,
      builderConfig: {
        tools: {
          tsChecker: {},
        },
      },
    });

    expect(
      await builder.matchWebpackPlugin('ForkTsCheckerWebpackPlugin'),
    ).toBeTruthy();
  });

  it('should allow to modify the config of tsChecker plugin', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginTsChecker()],
      context,
      builderConfig: {
        tools: {
          tsChecker: {
            async: false,
          },
        },
      },
    });
    const config = await builder.unwrapWebpackConfig();
    expect(config).toMatchSnapshot();
  });

  it('should only apply one tsChecker plugin when there is multiple targets', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginTsChecker()],
      context,
      target: ['web', 'node'],
    });

    const configs = await builder.unwrapWebpackConfigs();
    expect(configs).toMatchSnapshot();
  });
});
