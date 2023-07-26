import { expect, describe, it, vi, SpyInstance } from 'vitest';
import { isFileExists } from '@modern-js/builder-shared';
import { builderPluginResolve } from '../../src/plugins/resolve';
import { createBuilder } from '../helper';

vi.mock('@modern-js/builder-shared', async importOriginal => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    isFileExists: vi.fn(),
  };
});

describe('plugins/resolve', () => {
  it('should apply default extensions correctly', async () => {
    (isFileExists as unknown as SpyInstance).mockImplementationOnce(() =>
      Promise.resolve(false),
    );
    const builder = await createBuilder({
      plugins: [builderPluginResolve()],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].resolve?.extensions).toEqual([
      '.js',
      '.jsx',
      '.mjs',
      '.json',
    ]);
    expect(bundlerConfigs[0].resolve?.tsConfigPath).toBeUndefined();
  });

  it('should apply default extensions correctly and tsConfigPath with ts', async () => {
    (isFileExists as unknown as SpyInstance).mockImplementationOnce(() =>
      Promise.resolve(true),
    );

    const builder = await createBuilder({
      plugins: [builderPluginResolve()],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].resolve?.extensions).toEqual([
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.mjs',
      '.json',
    ]);
    expect(bundlerConfigs[0].resolve?.tsConfigPath).toBeDefined();
  });

  it('should not apply tsConfigPath when aliasStrategy is "prefer-alias"', async () => {
    (isFileExists as unknown as SpyInstance).mockImplementationOnce(() =>
      Promise.resolve(true),
    );

    const builder = await createBuilder({
      plugins: [builderPluginResolve()],
      builderConfig: {
        source: {
          aliasStrategy: 'prefer-alias',
        },
      },
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].resolve?.tsConfigPath).toBeUndefined();
  });

  it('should allow to use source.alias to config alias', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginResolve()],
      builderConfig: {
        source: {
          alias: {
            foo: 'bar',
          },
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].resolve?.alias).toEqual({
      foo: 'bar',
    });
  });

  it('should support source.alias to be a function', async () => {
    const builder = await createBuilder({
      plugins: [builderPluginResolve()],
      builderConfig: {
        source: {
          alias() {
            return {
              foo: 'bar',
            };
          },
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].resolve?.alias).toEqual({
      foo: 'bar',
    });
  });

  it('should support custom resolve.mainFields', async () => {
    const mainFieldsOption = ['main', 'test', 'browser', ['module', 'exports']];

    const builder = await createBuilder({
      plugins: [builderPluginResolve()],
      builderConfig: {
        source: {
          resolveMainFields: mainFieldsOption,
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].resolve?.mainFields).toEqual([
      'main',
      'test',
      'browser',
      'module',
      'exports',
    ]);
  });

  it('should support custom webpack resolve.mainFields by target', async () => {
    const mainFieldsOption = {
      web: ['main', 'browser'],
      node: ['main', 'node'],
    };

    const builder = await createBuilder({
      plugins: [builderPluginResolve()],
      builderConfig: {
        source: {
          resolveMainFields: mainFieldsOption,
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0].resolve?.mainFields).toEqual(mainFieldsOption.web);
  });
});
