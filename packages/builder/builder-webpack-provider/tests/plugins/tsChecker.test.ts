import { expect, describe, it } from 'vitest';
import { PluginTsChecker } from '../../src/plugins/tsChecker';
import { createStubBuilder } from '../../src/stub';
import type { Context } from '../../src/types';

describe('plugins/tsChecker', () => {
  const context = {
    tsconfigPath: '/path/tsconfig.json',
  } as Context;

  it('should disable ts-checker when tools.tsChecker is false', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginTsChecker()],
      context,
      builderConfig: {
        tools: {
          tsChecker: false,
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

  it('should enable tsChecker plugin when tools.tsChecker is true', async () => {
    const builder = await createStubBuilder({
      plugins: [PluginTsChecker()],
      context,
      builderConfig: {
        tools: {
          tsChecker: true,
        },
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
});
