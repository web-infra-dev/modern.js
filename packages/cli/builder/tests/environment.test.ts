import { join } from 'node:path';
import { describe, expect, it } from '@rstest/core';
import { createBuilder } from '../src';

describe('builder environment compatibility', () => {
  it.each([
    [false, 'commonjs2'],
    [true, 'module'],
  ] as const)(
    'selects the worker library format for output.module=%s',
    async (outputModule, libraryType) => {
      const cwd = join(__dirname, '..');
      const builder = await createBuilder({
        cwd,
        bundlerType: 'rspack',
        config: {
          environments: {
            workerSSR: {
              output: { target: 'web-worker', module: outputModule },
            },
            server: { output: { target: 'node' } },
            client: {},
          },
        },
      });

      const configs = await builder.initConfigs();
      expect(configs.map(config => config.name)).toEqual([
        'client',
        'server',
        'workerSSR',
      ]);
      expect(configs[1].output?.path).toBe(join(cwd, 'dist', 'bundles'));
      expect(configs[2].output).toMatchObject({
        path: join(cwd, 'dist', 'worker'),
        library: { type: libraryType },
      });
    },
  );
});
