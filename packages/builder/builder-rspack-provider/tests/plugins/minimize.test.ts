import { expect, describe, it } from 'vitest';
import { createBuilder } from '../helper';
import { builderPluginMinimize } from '@/plugins/minimize';

describe('plugins/minimize', () => {
  it('should not apply minimizer in development', async () => {
    process.env.NODE_ENV = 'development';

    const builder = await createBuilder({
      plugins: [builderPluginMinimize()],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].optimization?.minimize).toEqual(false);
    expect(bundlerConfigs[0].builtins?.minifyOptions).toBeUndefined();

    process.env.NODE_ENV = 'test';
  });

  it('should apply minimizer in production', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({
      plugins: [builderPluginMinimize()],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].optimization?.minimize).toEqual(true);

    expect(bundlerConfigs[0].builtins?.minifyOptions).toEqual({
      extractComments: true,
    });

    process.env.NODE_ENV = 'test';
  });

  it('should not apply minimizer when output.disableMinimize is true', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({
      plugins: [builderPluginMinimize()],
      builderConfig: {
        output: {
          disableMinimize: true,
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].optimization?.minimize).toEqual(false);

    process.env.NODE_ENV = 'test';
  });

  it('should dropConsole when performance.removeConsole is true', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({
      plugins: [builderPluginMinimize()],
      builderConfig: {
        performance: {
          removeConsole: true,
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].builtins?.minifyOptions).toEqual({
      extractComments: true,
      dropConsole: true,
    });

    process.env.NODE_ENV = 'test';
  });

  it('should remove specific console when performance.removeConsole is array', async () => {
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({
      plugins: [builderPluginMinimize()],
      builderConfig: {
        performance: {
          removeConsole: ['log', 'warn'],
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].builtins?.minifyOptions).toEqual({
      pureFuncs: ['console.log', 'console.warn'],
      extractComments: true,
    });

    process.env.NODE_ENV = 'test';
  });
});
