import { describe, expect, it } from '@rstest/core';
import { createBuilder } from '../src';

describe('RSC build environments', () => {
  it.each([
    { rsc: true, server: 'server', client: 'client' },
    {
      rsc: { environments: { server: 'Server', client: 'Render' } },
      server: 'Server',
      client: 'Render',
    },
  ] as const)(
    'assigns the SSR entry to $server and the web entry to $client',
    async ({ rsc, server, client }) => {
      const entry = './src/index.ts';
      const builder = await createBuilder({
        bundlerType: 'rspack',
        cwd: __dirname,
        internalDirectory: __dirname,
        config: { server: { rsc }, source: { entry: { main: entry } } },
      });

      const configs = await builder.initConfigs();
      expect(configs.map(config => config.name).sort()).toEqual(
        [server, client].sort(),
      );
      expect(
        configs.find(config => config.name === server)?.entry,
      ).toMatchObject({
        main: {
          import: expect.arrayContaining([entry]),
          layer: 'server-side-rendering',
        },
      });
      expect(
        configs.find(config => config.name === client)?.entry,
      ).toMatchObject({
        main: expect.arrayContaining([entry]),
      });
    },
  );
});
