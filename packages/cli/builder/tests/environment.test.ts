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

  it('should use module library output when service-worker output module is enabled', async () => {
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
        get: (key: string) => (key === 'module' ? true : undefined),
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

    expect(libraryCalls).toEqual([{ type: 'module' }]);
  });
});
