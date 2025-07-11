import { AppContext, type CliPlugin, manager } from '@modern-js/core';
import { runtimePlugin } from '../../src/cli';
import plugin, { useLocation, useParams } from '../../src/router';
import { routerPlugin } from '../../src/router/cli';

describe('plugin-router', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(useLocation).toBeDefined();
    expect(useParams).toBeDefined();
  });
});

describe('cli-router', () => {
  const main = manager
    .clone()
    .usePlugin(runtimePlugin as CliPlugin, routerPlugin as CliPlugin);
  let runner: any;

  beforeAll(async () => {
    runner = await main.init();
  });

  test('should plugin-router defined', async () => {
    expect(routerPlugin).toBeDefined();
  });

  it('plugin-router cli config is defined', async () => {
    AppContext.set({ metaName: 'modern-js' } as any);
    const config = await runner.config();
    expect(
      config.find(
        (item: any) => item.resolve.alias['@modern-js/runtime/plugins'],
      ),
    ).toBeTruthy();
  });
});
