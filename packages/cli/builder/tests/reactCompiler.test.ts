import { join } from 'path';
import type { Rspack } from '@rsbuild/core';
import { describe, expect, test } from '@rstest/core';
import { createBuilder } from '../src';
import { parseCommonConfig } from '../src/shared/parseCommonConfig';
import type { BuilderConfig } from '../src/types';

function getSwcTransformOptions(config: Rspack.Configuration) {
  for (const rule of config.module?.rules || []) {
    if (!rule || typeof rule !== 'object') {
      continue;
    }
    const uses = Array.isArray(rule.use) ? rule.use : [rule.use];
    for (const use of uses) {
      if (
        use &&
        typeof use === 'object' &&
        use.loader?.includes('swc-loader') &&
        typeof use.options === 'object'
      ) {
        return (use.options as Rspack.SwcLoaderOptions).jsc?.transform;
      }
    }
  }
  return undefined;
}

async function getBundlerConfig(config: BuilderConfig) {
  const rsbuild = await createBuilder({
    bundlerType: 'rspack',
    config,
    cwd: join(__dirname, '..'),
  });
  const {
    origin: { bundlerConfigs },
  } = await rsbuild.inspectConfig();
  return bundlerConfigs[0];
}

describe('source.reactCompiler', () => {
  test('should not enable react compiler by default', async () => {
    const transform = getSwcTransformOptions(await getBundlerConfig({}));

    expect(transform).toBeDefined();
    expect(transform).not.toHaveProperty('reactCompiler');
  });

  test('should enable react compiler when set to true', async () => {
    const transform = getSwcTransformOptions(
      await getBundlerConfig({
        source: {
          reactCompiler: true,
        },
      }),
    );

    expect(transform?.reactCompiler).toEqual(true);
  });

  test('should pass through react compiler options object', async () => {
    const transform = getSwcTransformOptions(
      await getBundlerConfig({
        source: {
          reactCompiler: {
            target: '18',
            compilationMode: 'annotation',
          },
        },
      }),
    );

    expect(transform?.reactCompiler).toEqual({
      target: '18',
      compilationMode: 'annotation',
    });
  });

  test('should not leak reactCompiler into rsbuild source config', async () => {
    const { rsbuildConfig } = await parseCommonConfig({
      source: {
        reactCompiler: true,
      },
    });

    expect(rsbuildConfig.source).not.toHaveProperty('reactCompiler');
  });
});
