import { join } from 'path';
import { afterEach, describe, expect, it, rstest } from '@rstest/core';
import { after } from 'lodash';
import { createBuilder } from '../src';
import { pluginEnvironmentDefaults } from '../src/plugins/environmentDefaults';

describe('builder environment compat', () => {
  afterEach(() => {
    rstest.unstubAllEnvs();
  });
  it('should generator environment config correctly', async () => {
    rstest.stubEnv('NODE_ENV', 'development');

    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {
        environments: {
          client: {},
          server: {
            output: {
              target: 'node',
            },
          },
          workerSSR: {
            output: {
              target: 'web-worker',
            },
          },
        },
      },
      cwd: join(__dirname, '..'),
    });

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs.map(c => c.name)).toEqual([
      'client',
      'server',
      'workerSSR',
    ]);

    expect(bundlerConfigs).toMatchSnapshot();
  });

  it.each([
    { library: undefined, outputModule: true, expected: { type: 'module' } },
    {
      library: undefined,
      outputModule: false,
      expected: { type: 'commonjs2' },
    },
    {
      library: 'worker',
      outputModule: false,
      expected: { name: 'worker', type: 'commonjs2' },
    },
    {
      library: ['app', 'worker'],
      outputModule: false,
      expected: { name: ['app', 'worker'], type: 'commonjs2' },
    },
    {
      library: { name: 'worker', export: 'default', type: 'var' },
      outputModule: false,
      expected: { name: 'worker', export: 'default', type: 'commonjs2' },
    },
    {
      library: { export: 'default', type: 'var' },
      outputModule: true,
      expected: { export: 'default', type: 'module' },
    },
  ])(
    'should preserve service-worker library options: %j',
    async ({ library, outputModule, expected }) => {
      let handler: ((chain: any, utils: any) => Promise<void>) | undefined;

      pluginEnvironmentDefaults().setup({
        modifyBundlerChain: (registeredHandler: any) => {
          handler =
            typeof registeredHandler === 'function'
              ? registeredHandler
              : registeredHandler.handler;
        },
        modifyEnvironmentConfig: () => {},
        modifyRsbuildConfig: () => {},
      } as any);

      if (!handler) {
        throw new Error('Expected environment defaults bundler-chain handler.');
      }

      const libraryCalls: any[] = [];
      const chain = {
        output: {
          get: (key: string) => (key === 'module' ? outputModule : library),
          library: (value: any) => {
            libraryCalls.push(value);
          },
        },
      };

      await handler(chain, {
        environment: {
          name: 'workerSSR',
        },
      });

      expect(libraryCalls).toEqual([expected]);
    },
  );
});
